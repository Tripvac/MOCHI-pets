import { useEffect, useRef } from "react";
import { lampSource } from "../shared/scene-geometry.mjs";
export interface Emitter {
  position: number[];
  aspect: number;
  slot?: string;
  supportRise?: number;
  supportOffset?: number;
}
// This canvas renders light only. Native room, furniture and glass remain visible
// even when a device disables WebGL or a context is lost.
export default function LightingShader({
  night,
  emitters,
  motion,
}: {
  night: boolean;
  emitters: Emitter[];
  motion: boolean;
}) {
  const host = useRef<HTMLCanvasElement>(null),
    live = useRef({ night, emitters, motion });
  live.current = { night, emitters, motion };
  useEffect(() => {
    const canvas = host.current!;
    try {
      let closed = false;
      const gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        powerPreference: "low-power",
      });
      if (!gl) return;
      const shader = (type: number, source: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          gl.deleteShader(s);
          return null;
        }
        return s;
      };
      const vs = shader(
        gl.VERTEX_SHADER,
        `#version 300 es\nin vec2 aPosition;out vec2 uv;void main(){uv=(aPosition+1.)*.5;uv.y=1.-uv.y;gl_Position=vec4(aPosition,0.,1.);}`,
      );
      const fs = shader(
        gl.FRAGMENT_SHADER,
        `#version 300 es
precision highp float;in vec2 uv;out vec4 color;uniform vec2 uSize;uniform vec2 uLamps[4];uniform int uCount;uniform float uNight;
void main(){float lux=0.;for(int i=0;i<4;i++){if(i>=uCount)break;vec2 d=(uv-uLamps[i])*vec2(uSize.x/uSize.y,1.);float radius=.11;lux+=.014/(dot(d,d)+radius*radius);}
 float light=1.-exp(-lux*.19);float alpha=min(.28,light*.33)*uNight;vec3 warmth=vec3(1.,.68,.29);color=vec4(warmth*alpha,alpha);}`,
      );
      if (!vs || !fs) {
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        return;
      }
      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return;
      }
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.useProgram(program);
      const pos = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      const size = gl.getUniformLocation(program, "uSize"),
        lamps = gl.getUniformLocation(program, "uLamps[0]"),
        count = gl.getUniformLocation(program, "uCount"),
        level = gl.getUniformLocation(program, "uNight");
      const draw = () => {
        if (closed || document.hidden || gl.isContextLost()) return;
        const rect = canvas.getBoundingClientRect(),
          w = Math.max(1, rect.width),
          h = Math.max(1, rect.height),
          ratio = Math.min(devicePixelRatio || 1, 1.5);
        const width = Math.round(w * ratio),
          height = Math.round(h * ratio);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        const s = live.current,
          points = new Float32Array(8);
        s.emitters
          .slice(0, 4)
          .forEach((e, i) =>
            points.set(
              lampSource(
                e.position,
                e.aspect,
                w,
                h,
                e.slot === "ceiling" ? 0.22 : e.slot === "lava" ? 0.48 : 0.73,
                e.supportRise || 0,
                e.supportOffset || 0,
              ),
              i * 2,
            ),
          );
        gl.uniform2f(size, w, h);
        gl.uniform2fv(lamps, points);
        gl.uniform1i(count, Math.min(4, s.emitters.length));
        gl.uniform1f(level, s.night ? 1 : 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      draw();
      const timer = setInterval(draw, 160);
      const lost = (e: Event) => {
        e.preventDefault();
        canvas.style.display = "none";
      };
      canvas.addEventListener("webglcontextlost", lost);
      return () => {
        closed = true;
        clearInterval(timer);
        canvas.removeEventListener("webglcontextlost", lost);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      };
    } catch {
      canvas.style.display = "none";
      return;
    }
  }, []);
  return (
    <canvas ref={host} className="room-lighting-shader" aria-hidden="true" />
  );
}
