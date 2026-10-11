import type { FrameCaptureOptions } from "./FrameCaptureOptions.js";
import { ImageEncoding } from "./ImageEncoding.js";

/**
 * Copies the frame an `HTMLVideoElement` is showing, at the video's own resolution.
 */
export class FrameCapture {
  private readonly video: HTMLVideoElement;

  /**
   * Bind the capture to a video element.
   *
   * @param video - Element whose current frame is captured.
   */
  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  /**
   * Encode the frame on screen as an image.
   *
   * @param options - Image format and quality; PNG by default.
   * @returns The image.
   * @throws Error When the video has no decoded frame yet or the browser cannot encode it.
   */
  toBlob(options: FrameCaptureOptions = {}): Promise<Blob> {
    const { videoWidth: width, videoHeight: height }: HTMLVideoElement = this.video;
    if (width === 0 || height === 0) {
      return Promise.reject(new Error("The video has no decoded frame to capture"));
    }
    return FrameCapture.encode(this.video, width, height, options);
  }

  /**
   * Encode any drawable image, such as a WebCodecs `VideoFrame`.
   *
   * The image is drawn synchronously, so the caller may release it as soon as this returns.
   *
   * @param image - Image to encode.
   * @param width - Width of the encoded image in pixels.
   * @param height - Height of the encoded image in pixels.
   * @param options - Image format and quality; PNG by default.
   * @returns The encoded image.
   * @throws Error When the browser cannot encode the image.
   */
  static encode(image: CanvasImageSource, width: number, height: number, options: FrameCaptureOptions = {}): Promise<Blob> {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (context === null) {
      return Promise.reject(new Error("The browser provides no 2D canvas context"));
    }
    context.drawImage(image, 0, 0, width, height);
    return new Promise<Blob>((resolve: (blob: Blob) => void, reject: (error: Error) => void) => {
      canvas.toBlob(
        (blob: Blob | null) => {
          if (blob === null) {
            reject(new Error("The browser could not encode the frame"));
          } else {
            resolve(blob);
          }
        },
        options.encoding ?? ImageEncoding.PNG,
        options.quality,
      );
    });
  }

  /**
   * Put the frame on screen on the clipboard as a PNG image.
   *
   * The clipboard write starts synchronously, so call it directly from a
   * click or key handler; browsers refuse clipboard writes outside user input.
   *
   * @throws Error When capturing fails or the browser denies clipboard access.
   */
  async copyToClipboard(): Promise<void> {
    if (typeof ClipboardItem === "undefined" || !("clipboard" in navigator)) {
      throw new Error("This browser cannot write images to the clipboard");
    }
    await navigator.clipboard.write([new ClipboardItem({ [ImageEncoding.PNG]: this.toBlob() })]);
  }
}
