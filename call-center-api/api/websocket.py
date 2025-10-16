from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from crud.agent import agent_crud
from database import get_db

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_subscriptions: Dict[str, List[str]] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.user_subscriptions[client_id] = []
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
        await self.send_personal_message({
            "type": "connection",
            "message": "Connected to Call Center API",
            "timestamp": datetime.utcnow().isoformat(),
            "client_id": client_id
        }, client_id)
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.user_subscriptions:
            del self.user_subscriptions[client_id]
        logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")
        
    async def send_to_client(self, client_id: str, message: dict):
        """Send message to a specific client"""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                message["timestamp"] = datetime.utcnow().isoformat()
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
        else:
            logger.warning(f"Client {client_id} not found in active connections")
                
    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
                
    async def broadcast(self, message: dict, subscription_type: str = None, agent_type: str = None):
        message["timestamp"] = datetime.utcnow().isoformat()
        target_clients = []
        async for db in get_db():
            for client_id, subscriptions in self.user_subscriptions.items():
                if subscription_type and subscription_type not in subscriptions:
                    continue
                if not client_id.startswith("user-"):
                    continue
                user_id = client_id.replace("user-", "")
                user = await agent_crud.get_user(db, user_id)
                if not user:
                    continue
                if user.role == "super-admin" or (agent_type and self.get_agent_type(user.designation) == agent_type):
                    target_clients.append(client_id)
            
        disconnected_clients = []
        for client_id in target_clients:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
                
        for client_id in disconnected_clients:
            self.disconnect(client_id)
            

            
    async def subscribe(self, client_id: str, subscription_type: str):
        if client_id in self.user_subscriptions:
            if subscription_type not in self.user_subscriptions[client_id]:
                self.user_subscriptions[client_id].append(subscription_type)
                await self.send_personal_message({
                    "type": "subscription",
                    "message": f"Subscribed to {subscription_type}",
                    "subscription_type": subscription_type
                }, client_id)
                
    async def unsubscribe(self, client_id: str, subscription_type: str):
        if client_id in self.user_subscriptions:
            if subscription_type in self.user_subscriptions[client_id]:
                self.user_subscriptions[client_id].remove(subscription_type)
                await self.send_personal_message({
                    "type": "unsubscription",
                    "message": f"Unsubscribed from {subscription_type}",
                    "subscription_type": subscription_type
                }, client_id)
                
    async def broadcast_call_update(self, call_data: dict):
        message = {
            "type": "call_update",
            "data": call_data
        }
        await self.broadcast(message, "calls", call_data.get("agent_type"))
        
    async def broadcast_agent_update(self, agent_data: dict):
        message = {
            "type": "agent_update",
            "data": agent_data
        }
        await self.broadcast(message, "agents", agent_data.get("agent_type"))
        
    async def broadcast_agent_status_change(self, agent_data: dict):
        message = {
            "type": "agent_status_change",
            "data": agent_data
        }
        await self.broadcast(message, "agents", agent_data.get("agent_type"))
        
    async def broadcast_new_call(self, call_data: dict):
        message = {
            "type": "new_call",
            "data": call_data
        }
        await self.broadcast(message, "calls", call_data.get("agent_type"))
        
    async def broadcast_call_ended(self, call_data: dict):
        message = {
            "type": "call_ended",
            "data": call_data
        }
        await self.broadcast(message, "calls", call_data.get("agent_type"))
        
    async def broadcast_queue_update(self, queue_data: dict):
        message = {
            "type": "queue_update",
            "data": queue_data
        }
        await self.broadcast(message, "queues", queue_data.get("agent_type"))
        
    async def broadcast_hourly_stats(self, stats_data: list, agent_type: str = None):
        message = {
            "type": "hourly_stats",
            "data": stats_data
        }
        await self.broadcast(message, "hourly_stats", agent_type)
        
    async def broadcast_system_alert(self, alert_data: dict):
        message = {
            "type": "system_alert",
            "data": alert_data
        }
        await self.broadcast(message)
        
    def get_connection_stats(self) -> dict:
        subscription_counts = {}
        for subscriptions in self.user_subscriptions.values():
            for sub_type in subscriptions:
                subscription_counts[sub_type] = subscription_counts.get(sub_type, 0) + 1
                
        return {
            "total_connections": len(self.active_connections),
            "subscription_counts": subscription_counts,
            "connected_clients": list(self.active_connections.keys())
        }
    
    def get_agent_type(self, designation: str) -> str:
        return {
            "call-center-admin": "recovery-agent",
            "marketing-admin": "marketing-agent",
            "compliance-admin": "compliance-agent",
        }.get(designation, "")

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await handle_websocket_message(client_id, data)
    except WebSocketDisconnect:
        manager.disconnect(client_id)

async def handle_websocket_message(client_id: str, message: str):
    try:
        data = json.loads(message)
        message_type = data.get("type")
        
        if message_type == "subscribe":
            subscription_type = data.get("subscription_type")
            if subscription_type:
                await manager.subscribe(client_id, subscription_type)
                
        elif message_type == "unsubscribe":
            subscription_type = data.get("subscription_type")
            if subscription_type:
                await manager.unsubscribe(client_id, subscription_type)
                
        elif message_type == "ping":
            await manager.send_personal_message({
                "type": "pong",
                "message": "pong"
            }, client_id)
            
        else:
            await manager.send_personal_message({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }, client_id)
            
    except json.JSONDecodeError:
        await manager.send_personal_message({
            "type": "error",
            "message": "Invalid JSON message"
        }, client_id)
    except Exception as e:
        logger.error(f"Error handling WebSocket message from {client_id}: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": "Internal server error"
        }, client_id)