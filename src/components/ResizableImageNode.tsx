import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Image as BaseImage } from '@tiptap/extension-image';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Maximize2, RotateCcw } from 'lucide-react';

export function ResizableImageNode(props: NodeViewProps) {
  const { node, selected, updateAttributes, deleteNode, editor } = props;
  const { src, alt, title, width, height, alignment = 'center' } = node.attrs;

  const [isResizing, setIsResizing] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<string | null>(null);
  const [dragDimensions, setDragDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure natural aspect ratio
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalAspect(img.naturalWidth / img.naturalHeight);
    }
  };

  const startResizing = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imgRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imgRef.current.clientWidth;
    const startHeight = imgRef.current.clientHeight;

    const aspect = naturalAspect || (startHeight > 0 ? startWidth / startHeight : 16 / 9);

    setIsResizing(true);
    setResizingCorner(corner);
    setDragDimensions({ w: startWidth, h: startHeight });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      let newW = startWidth;

      if (corner === 'se' || corner === 'ne') {
        newW = startWidth + deltaX;
      } else if (corner === 'sw' || corner === 'nw') {
        newW = startWidth - deltaX;
      }

      // Constrain width between 60px and container max width (e.g. 1200px)
      const containerWidth = containerRef.current?.parentElement?.clientWidth || 800;
      newW = Math.max(60, Math.min(newW, containerWidth));
      const newH = Math.round(newW / aspect);

      setDragDimensions({ w: Math.round(newW), h: newH });
      updateAttributes({
        width: Math.round(newW),
        height: newH,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingCorner(null);
      setDragDimensions(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: align });
  };

  const handlePresetSize = (percentage: number) => {
    if (!containerRef.current) return;
    const parentW = containerRef.current.parentElement?.clientWidth || 800;
    const targetW = Math.round((parentW * percentage) / 100);
    const aspect = naturalAspect || (imgRef.current ? imgRef.current.naturalWidth / imgRef.current.naturalHeight : 16 / 9);
    const targetH = Math.round(targetW / aspect);

    updateAttributes({
      width: targetW,
      height: targetH,
    });
  };

  const handleResetSize = () => {
    updateAttributes({
      width: null,
      height: null,
    });
  };

  // Determine current display width & height
  const currentWidth = dragDimensions?.w ?? width ?? 'auto';
  const currentHeight = dragDimensions?.h ?? height ?? 'auto';

  // Alignment classes
  const alignmentClass =
    alignment === 'left'
      ? 'justify-start'
      : alignment === 'right'
      ? 'justify-end'
      : 'justify-center';

  const showControls = selected || isHovered || isResizing;

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`my-4 flex w-full select-none ${alignmentClass}`}
    >
      <div
        className="relative inline-block group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Image */}
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          onLoad={handleImageLoad}
          style={{
            width: typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth,
            height: typeof currentHeight === 'number' ? `${currentHeight}px` : currentHeight,
            maxWidth: '100%',
            objectFit: 'contain',
          }}
          className={`rounded-lg transition-shadow duration-150 block ${
            selected
              ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-zinc-900 shadow-xl'
              : showControls
              ? 'ring-1 ring-teal-400/50 shadow-md'
              : ''
          }`}
        />

        {/* Resizing Overlay corner handles & dimension badge */}
        {showControls && editor?.isEditable && (
          <>
            {/* Outline Box */}
            <div className="absolute inset-0 border-2 border-teal-500/80 rounded-lg pointer-events-none" />

            {/* Corner Handle: Top-Left */}
            <div
              onMouseDown={(e) => startResizing(e, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-30 shadow-md"
              title="Drag to resize image"
            />

            {/* Corner Handle: Top-Right */}
            <div
              onMouseDown={(e) => startResizing(e, 'ne')}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-full cursor-nesw-resize hover:scale-125 transition-transform z-30 shadow-md"
              title="Drag to resize image"
            />

            {/* Corner Handle: Bottom-Left */}
            <div
              onMouseDown={(e) => startResizing(e, 'sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-full cursor-nesw-resize hover:scale-125 transition-transform z-30 shadow-md"
              title="Drag to resize image"
            />

            {/* Corner Handle: Bottom-Right */}
            <div
              onMouseDown={(e) => startResizing(e, 'se')}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-teal-600 rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-30 shadow-md"
              title="Drag to resize image"
            />

            {/* Dimensions Badge */}
            <div className="absolute bottom-2 right-2 bg-zinc-950/90 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg pointer-events-none backdrop-blur-sm z-20">
              {imgRef.current
                ? `${imgRef.current.clientWidth} × ${imgRef.current.clientHeight} px`
                : `${width || 'Auto'} × ${height || 'Auto'}`}
            </div>

            {/* Quick Floating Action Controls Bar above image */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-white border border-zinc-700/80 rounded-lg shadow-xl px-1.5 py-1 flex items-center gap-1 z-40 backdrop-blur-md text-xs">
              {/* Quick Preset sizes */}
              <button
                type="button"
                onClick={() => handlePresetSize(25)}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white cursor-pointer"
                title="Resize to 25% width"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handlePresetSize(50)}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white cursor-pointer"
                title="Resize to 50% width"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handlePresetSize(75)}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white cursor-pointer"
                title="Resize to 75% width"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handlePresetSize(100)}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white cursor-pointer"
                title="Resize to 100% width"
              >
                100%
              </button>
              <button
                type="button"
                onClick={handleResetSize}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                title="Reset to original dimensions"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <div className="w-px h-3 bg-zinc-700 my-auto" />

              {/* Align buttons */}
              <button
                type="button"
                onClick={() => handleAlign('left')}
                className={`p-1 rounded cursor-pointer transition-colors ${
                  alignment === 'left' ? 'bg-teal-500 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleAlign('center')}
                className={`p-1 rounded cursor-pointer transition-colors ${
                  alignment === 'center' ? 'bg-teal-500 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleAlign('right')}
                className={`p-1 rounded cursor-pointer transition-colors ${
                  alignment === 'right' ? 'bg-teal-500 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3 h-3" />
              </button>

              <div className="w-px h-3 bg-zinc-700 my-auto" />

              {/* Delete button */}
              <button
                type="button"
                onClick={deleteNode}
                className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                title="Delete Image"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImageExtension = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute('width') || element.style.width;
          if (!w) return null;
          const clean = w.replace('px', '').trim();
          return isNaN(Number(clean)) ? w : Number(clean);
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const val = typeof attributes.width === 'number' ? `${attributes.width}px` : attributes.width;
          return {
            width: attributes.width,
            style: `width: ${val}; max-width: 100%;`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const h = element.getAttribute('height') || element.style.height;
          if (!h) return null;
          const clean = h.replace('px', '').trim();
          return isNaN(Number(clean)) ? h : Number(clean);
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          const val = typeof attributes.height === 'number' ? `${attributes.height}px` : attributes.height;
          return {
            height: attributes.height,
            style: `height: ${val};`,
          };
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.alignment || 'center',
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});
