import { respondWithJSON } from "./json";

import { type ApiConfig } from "../config";
import type { BunRequest } from "bun";

export async function handlerUploadVideo(cfg: ApiConfig, req: BunRequest) {
  return respondWithJSON(200, null);
}

export async function getVideoAspectRatio(filePath: string): Promise<string> {
  const args = [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "json",
    filePath,
  ];

  const proc = Bun.spawn({
    cmd: ["ffprobe", ...args],
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`ffprobe failed with exit code ${exitCode}`);
  }

  const data = JSON.parse(stdout);
  const stream = data.streams?.[0];
  if (!stream || !stream.width || !stream.height) {
    throw new Error("Could not determine video dimensions");
  }

  const { width, height } = stream;

  const ratio = width / height;

  const epsilon = 0.05;
  if (Math.abs(ratio - 16 / 9) < epsilon) {
    return "landscape";
  } else if (Math.abs(ratio - 9 / 16) < epsilon) {
    return "portrait";
  } else {
    return "other";
  }
}
