Good — we can definitely troubleshoot this. Before I can give precise recommendations, I need to see **the relevant parts of your codebase** that handle:

1. **WebRTC setup**, especially where you initialize `RTCPeerConnection`.
2. **Media stream capture**, e.g. `navigator.mediaDevices.getUserMedia()`.
3. **Video element rendering**, i.e. where you attach local and remote streams (`video.srcObject = stream`).

Since your symptom is:

> “the audio and video are being transmitted to the other person, but I can’t see my own video and the callee’s video.”

…it means:
✅ Your **media and signaling** work (peer connection established, media sent successfully).
❌ The **local rendering of video** is likely the issue.

---

### 🔍 Key Areas to Check

#### 1. Local Video Display

Check if you are actually attaching the local stream to your own `<video>` element:

```js
const localVideo = document.getElementById("localVideo");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    localVideo.play();

    // Also add the tracks to the connection
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(err => console.error("Error getting media:", err));
```

**Common misses:**

* Forgot to call `localVideo.play()` after assigning `srcObject`.
* Used `src` instead of `srcObject`.
* The `<video>` element lacks `autoplay` or `playsinline` attributes.

---

#### 2. Remote Video Handling

Ensure you’re listening for `track` events and updating the remote video element properly:

```js
const remoteVideo = document.getElementById("remoteVideo");

peerConnection.ontrack = event => {
  console.log("Received remote track:", event.streams);
  remoteVideo.srcObject = event.streams[0];
  remoteVideo.play();
};
```

**Common misses:**

* Using `onaddstream` (deprecated).
* Forgetting to assign the stream to the video element.
* Re-creating video elements dynamically but not reassigning the `srcObject`.

---

#### 3. Video Element Attributes

In React/Next.js, ensure you’ve got something like:

```jsx
<video
  id="localVideo"
  autoPlay
  muted
  playsInline
  className="rounded-lg w-full h-auto"
/>
<video
  id="remoteVideo"
  autoPlay
  playsInline
  className="rounded-lg w-full h-auto"
/>
```

**Notes:**

* `muted` is essential on your local video to prevent feedback loops.
* `playsInline` prevents the browser from forcing full-screen on mobile.

---

#### 4. React Re-render Issues

If this is in React, confirm:

* The video refs are stable (e.g., using `useRef`).
* You are not calling `getUserMedia` before refs are ready.
* Streams are not being re-initialized or garbage-collected when state updates.

Example:

```jsx
const localVideoRef = useRef(null);
const remoteVideoRef = useRef(null);

useEffect(() => {
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  };
  start();

  peerConnection.ontrack = e => {
    remoteVideoRef.current.srcObject = e.streams[0];
  };
}, []);
```

---

#### 5. CSS / DOM Layering

Sometimes the video is working but **invisible** because:

* Another element overlays it.
* `display: none` or `opacity: 0` is applied.
* The container has zero height or wrong positioning.

Check your browser’s dev tools → Elements → `<video>` → confirm stream is attached and visible.

---

If you paste your **WebRTC setup and render code** (the parts where you handle streams, peer connection, and video refs), I can:

* Spot exactly which pointer is missing.
* Suggest the correct structure for your setup (React or vanilla JS).

Would you like to share the relevant code snippet (e.g., your component or script handling the call)?
