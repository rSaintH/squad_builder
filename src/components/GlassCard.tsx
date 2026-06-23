import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  refractionScale?: number;
  chroma?: number;
  contentClassName?: string;
}

interface LensMapOptions {
  width: number;
  height: number;
  radius: number;
  scale: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRectSdf(px: number, py: number, halfW: number, halfH: number, radius: number) {
  const qx = Math.abs(px) - halfW + radius;
  const qy = Math.abs(py) - halfH + radius;
  const outsideX = Math.max(qx, 0);
  const outsideY = Math.max(qy, 0);
  const outside = Math.hypot(outsideX, outsideY);
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}

function createLensMap({ width, height, radius, scale }: LensMapOptions) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const canvasWidth = Math.max(2, Math.round(width * pixelRatio));
  const canvasHeight = Math.max(2, Math.round(height * pixelRatio));
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "";

  const image = context.createImageData(canvasWidth, canvasHeight);
  const data = image.data;
  const halfW = canvasWidth / 2;
  const halfH = canvasHeight / 2;
  const scaledRadius = Math.max(1, radius * pixelRatio);
  const edgeBand = Math.max(16, scaledRadius * 1.15);
  const maxDim = Math.max(canvasWidth, canvasHeight);

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const distance = roundedRectSdf(px, py, halfW, halfH, scaledRadius);
      const insideDistance = Math.max(0, -distance);
      const edge = 1 - smoothstep(0, edgeBand, insideDistance);
      const centerFalloff = 1 - smoothstep(0, 0.92, Math.hypot(px / halfW, py / halfH));

      const nearestEdgeX = Math.abs(px) > halfW - scaledRadius ? Math.sign(px) : 0;
      const nearestEdgeY = Math.abs(py) > halfH - scaledRadius ? Math.sign(py) : 0;
      const cornerX = Math.sign(px) * Math.max(Math.abs(px) - (halfW - scaledRadius), 0);
      const cornerY = Math.sign(py) * Math.max(Math.abs(py) - (halfH - scaledRadius), 0);
      const cornerLength = Math.hypot(cornerX, cornerY) || 1;

      const normalX =
        cornerX || nearestEdgeX ? (cornerX || nearestEdgeX) / cornerLength : px / maxDim;
      const normalY =
        cornerY || nearestEdgeY ? (cornerY || nearestEdgeY) / cornerLength : py / maxDim;
      const barrelX = (px / maxDim) * centerFalloff * 0.38;
      const barrelY = (py / maxDim) * centerFalloff * 0.38;

      const bendX = (normalX * edge * 0.92 + barrelX) * scale;
      const bendY = (normalY * edge * 0.92 + barrelY) * scale;
      const offset = (y * canvasWidth + x) * 4;

      data[offset] = clamp(Math.round(128 + bendX * 127), 0, 255);
      data[offset + 1] = clamp(Math.round(128 + bendY * 127), 0, 255);
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function useGlassMap(ref: RefObject<HTMLDivElement | null>, scale: number) {
  const [map, setMap] = useState({ href: "", width: 0, height: 0, radius: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const styles = window.getComputedStyle(node);
        const radius = Number.parseFloat(styles.borderTopLeftRadius) || 18;
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width < 2 || height < 2) return;

        setMap((previous) => {
          if (
            previous.width === width &&
            previous.height === height &&
            previous.radius === radius
          ) {
            return previous;
          }

          return {
            href: createLensMap({ width, height, radius, scale }),
            width,
            height,
            radius,
          };
        });
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, scale]);

  return map;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { children, className, contentClassName, refractionScale = 0.82, chroma = 0.45, ...props },
    forwardedRef,
  ) => {
    const localRef = useRef<HTMLDivElement | null>(null);
    const reactId = useId();
    const filterId = useMemo(
      () => `glass-filter-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
      [reactId],
    );
    const map = useGlassMap(localRef, refractionScale);

    return (
      <div
        ref={(node) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={cn("glass-card", className)}
        {...props}
      >
        {map.href ? (
          <svg className="glass-filter-defs" aria-hidden="true" focusable="false">
            <filter
              id={filterId}
              x="-12%"
              y="-12%"
              width="124%"
              height="124%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={map.href}
                x="0"
                y="0"
                width={map.width}
                height={map.height}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale="18"
                xChannelSelector="R"
                yChannelSelector="G"
                result="main"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={String(18 + chroma * 8)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="redShift"
              />
              <feColorMatrix
                in="redShift"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"
                result="redFringe"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={String(18 - chroma * 6)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="blueShift"
              />
              <feColorMatrix
                in="blueShift"
                type="matrix"
                values="0 0 0 0 0  0 0.45 0 0 0  0 0 1 0 0  0 0 0 0.16 0"
                result="blueFringe"
              />
              <feMerge>
                <feMergeNode in="main" />
                <feMergeNode in="redFringe" />
                <feMergeNode in="blueFringe" />
              </feMerge>
            </filter>
          </svg>
        ) : null}
        <div
          className="glass-card__lens"
          style={map.href ? { filter: `url(#${filterId})` } : undefined}
          aria-hidden="true"
        />
        <div className={cn("glass-card__content", contentClassName)}>{children}</div>
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";
