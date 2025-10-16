from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
import logging

from utils.activity_logger import log_system_event

logger = logging.getLogger(__name__)

class ActivityContextMiddleware(BaseHTTPMiddleware):
    """Middleware to capture request context for activity logging"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Add request context to state for activity logging
        request.state.start_time = start_time
        request.state.ip_address = request.client.host if request.client else None
        request.state.user_agent = request.headers.get("user-agent")
        
        try:
            response = await call_next(request)
            
            # Log API access for non-health endpoints
            if not request.url.path.startswith(("/health", "/docs", "/redoc", "/openapi.json")):
                process_time = time.time() - start_time
                
                # Only log slow requests or errors to avoid spam
                if process_time > 2.0 or response.status_code >= 400:
                    severity = "warning" if response.status_code >= 400 else "info"
                    await log_system_event(
                        activity_type="api_request",
                        description=f"{request.method} {request.url.path} - {response.status_code} ({process_time:.2f}s)",
                        severity=severity,
                        context_data={
                            "method": request.method,
                            "path": request.url.path,
                            "status_code": response.status_code,
                            "process_time": process_time,
                            "query_params": str(request.query_params) if request.query_params else None
                        },
                        ip_address=request.state.ip_address,
                        user_agent=request.state.user_agent
                    )
            
            return response
            
        except Exception as e:
            # Log unhandled exceptions
            process_time = time.time() - start_time
            await log_system_event(
                activity_type="api_error",
                description=f"{request.method} {request.url.path} - Exception: {str(e)}",
                severity="error",
                context_data={
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(e),
                    "process_time": process_time
                },
                ip_address=request.state.ip_address,
                user_agent=request.state.user_agent
            )
            raise
