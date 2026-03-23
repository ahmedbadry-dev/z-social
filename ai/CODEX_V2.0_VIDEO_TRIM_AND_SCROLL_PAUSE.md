# CODEX TASK — V2.0: Video Trimming in PostComposer + Auto-Pause on Scroll

> Before writing any code, create and switch to a new git branch:
> ```bash
> git checkout -b feature/video-trim-and-scroll-pause
> ```
> Then read `AI_RULES.md` fully before starting. Follow every rule without exception.

---

## CONTEXT — WHAT EXISTS NOW

### `src/components/feed/post-composer.tsx`
- Has a single **"Add Media"** button (`<ImagePlus />` icon) that opens a hidden `<input type="file" accept="image/*,video/*" />`.
- When a video is selected, it shows a plain `<video>` preview with native controls.
- No video duration validation exists.
- No trimming UI exists.

### `src/components/feed/post-card.tsx`
- Renders videos with a plain `<video src={post.mediaUrl} controls />` tag.
- Video keeps playing when the user scrolls it out of view — no pause-on-scroll behavior exists.

### `src/hooks/use-post-media-upload.ts`
- Accepts any `File` and uploads it via UploadThing `postMedia` router.
- Returns `{ url, type }`.

### `src/app/api/uploadthing/core.ts`
- `postMedia` router accepts `image: { maxFileSize: "8MB" }` and `video: { maxFileSize: "64MB" }`.

---

## TASK 1 — Split "Add Media" into two separate buttons

In `post-composer.tsx`, replace the single **"Add Media"** button with **two separate buttons**:

1. **`<ImagePlus />` "Add Image"** — opens a file input that accepts `image/*` only.
2. **`<Video />` (lucide) "Add Video"** — opens a file input that accepts `video/*` only.

Each button gets its **own hidden `<input ref>`** with the correct `accept` attribute.

Keep the existing `onFileChange` logic — it already handles both image and video previews correctly; just wire each input to it.

UI layout: place both buttons side by side in the composer footer, left-aligned, before the character counter and Post button.

---

## TASK 2 — Video duration validation (max 10 minutes)

When the user selects a **video** file (via the "Add Video" button), before setting the preview:

1. Load the video's metadata using an off-screen `<video>` element to read `duration`.
2. If `duration > 600` seconds (10 minutes):
   - Show a `toast.error("Video is too long. Maximum allowed duration is 10 minutes.")`.
   - Do **not** set the file or preview — clear any existing selection.
   - Return early.
3. If duration is within the limit, proceed normally with `onFileChange(file)`.

Extract this into a helper function inside the component:

```ts
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error("Could not read video metadata"))
    }
    video.src = URL.createObjectURL(file)
  })
}
```

Call it inside the `onChange` handler of the video file input.

---

## TASK 3 — Video trimming UI in the composer

After the user selects a valid video and the preview appears, show a **trim UI** below the preview.

### What to build

Create a new client component: **`src/components/feed/video-trim-controls.tsx`**

Props:
```ts
interface VideoTrimControlsProps {
  videoSrc: string          // object URL of the selected file
  duration: number          // total duration in seconds
  trimStart: number         // current trim start (seconds)
  trimEnd: number           // current trim end (seconds)
  onTrimChange: (start: number, end: number) => void
}
```

The component renders:
- A **range-based trim bar** showing start and end handles.
  - Use two `<input type="range">` sliders stacked or side by side.
  - Left slider = `trimStart` (min: 0, max: trimEnd - 1, step: 0.1).
  - Right slider = `trimEnd` (min: trimStart + 1, max: duration, step: 0.1).
  - Enforce a minimum clip length of **3 seconds**: `trimEnd - trimStart >= 3`.
- A **time display** showing the selected range: e.g. `0:12 → 1:45 (1m 33s)`.
- A small helper text: `"Drag handles to select which part to post"`.

Use only **Tailwind CSS v4** for styling. No third-party slider libraries — use native `<input type="range">` elements.

### Wire the trim UI into `post-composer.tsx`

Add state:
```ts
const [trimStart, setTrimStart] = useState(0)
const [trimEnd, setTrimEnd] = useState(0)
const [videoDuration, setVideoDuration] = useState(0)
```

When a video is selected and passes duration validation:
- Set `videoDuration` to the video's actual duration.
- Set `trimStart` to `0` and `trimEnd` to the full duration (so default = no trim, post the whole video).

When the video preview is cleared (user clicks X), reset all three to `0`.

Show `<VideoTrimControls />` only when `mediaFile?.type.startsWith("video/")` and `mediaPreview` is set.

### Trimming the file before upload

When the user submits the post and `mediaFile` is a video:

1. Check if the user actually trimmed (i.e., `trimStart > 0 || trimEnd < videoDuration`).
2. If **no trimming** (full video), upload `mediaFile` as-is — no processing needed.
3. If **trimmed**, use the **Web MediaRecorder + HTMLVideoElement** approach to extract the clip:

```ts
async function trimVideo(file: File, start: number, end: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.src = URL.createObjectURL(file)
    video.preload = "auto"
    video.muted = true

    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")!
      const stream = canvas.captureStream(30)

      // Capture audio if available
      const audioCtx = new AudioContext()
      const src = audioCtx.createMediaElementSource(video)
      const dest = audioCtx.createMediaStreamDestination()
      src.connect(dest)
      src.connect(audioCtx.destination)
      stream.addTrack(dest.stream.getAudioTracks()[0])

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src)
        audioCtx.close()
        const blob = new Blob(chunks, { type: "video/webm" })
        resolve(new File([blob], "trimmed.webm", { type: "video/webm" }))
      }

      const drawFrame = () => {
        if (video.currentTime >= end) {
          recorder.stop()
          video.pause()
          return
        }
        ctx.drawImage(video, 0, 0)
        requestAnimationFrame(drawFrame)
      }

      video.currentTime = start
      video.onseeked = () => {
        recorder.start()
        video.play()
        drawFrame()
      }
    }

    video.onerror = () => reject(new Error("Video trim failed"))
  })
}
```

> **Important note in code comments:** This client-side trimming approach is suitable for short clips. For production at scale, consider a server-side solution (e.g., FFmpeg via a worker). Add this as a `// TODO:` comment in the file.

Show a loading state during trimming: replace the Post button with a spinner and the label `"Processing video..."` while `isTrimming` state is true. Add `const [isTrimming, setIsTrimming] = useState(false)` state.

In `onSubmit`, before calling `upload()`:
```ts
let fileToUpload = mediaFile
if (mediaFile.type.startsWith("video/") && (trimStart > 0 || trimEnd < videoDuration)) {
  setIsTrimming(true)
  try {
    fileToUpload = await trimVideo(mediaFile, trimStart, trimEnd)
  } finally {
    setIsTrimming(false)
  }
}
const uploaded = await upload(fileToUpload)
```

---

## TASK 4 — Auto-pause video on scroll (post-card.tsx)

### What to build

Create a new custom hook: **`src/hooks/use-video-pause-on-scroll.ts`**

```ts
import { useEffect, useRef } from "react"

export function useVideoPauseOnScroll() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause()
        }
      },
      { threshold: 0.3 } // pause when less than 30% visible
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return videoRef
}
```

### Wire it into `post-card.tsx`

1. Import `useVideoPauseOnScroll`.
2. Call `const videoRef = useVideoPauseOnScroll()` inside `PostCard`.
3. Attach `ref={videoRef}` to the existing `<video>` element that renders `post.mediaUrl`.

The video will now automatically pause whenever it is scrolled 70%+ out of the viewport. No visual changes to the card UI.

---

## FILES TO CREATE

| File | Description |
|------|-------------|
| `src/components/feed/video-trim-controls.tsx` | Trim slider UI component |
| `src/hooks/use-video-pause-on-scroll.ts` | IntersectionObserver hook for auto-pause |

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/components/feed/post-composer.tsx` | Split media button, add video validation, wire trim UI, trim before upload |
| `src/components/feed/post-card.tsx` | Attach `useVideoPauseOnScroll` to video element |

---

## RULES REMINDER

- Do **not** install any new packages. Use only what is already in `package.json`.
- All new components are `"use client"` — they use browser APIs (MediaRecorder, IntersectionObserver, URL.createObjectURL).
- All types must be explicit — no `any`.
- Keep the existing `onFileChange` function signature unchanged — only add to it.
- The trim UI must be visible **only** when a video file is selected — not for images.
- Do not touch `convex/`, `src/app/api/`, or any `ui/` shadcn components.
