export function carouselTrack(count: number, visible: number) {
  const looping = count > 1;
  const cloneCount = looping ? visible : 0;
  const centerOffset = Math.floor(visible / 2);
  const baseOffset = looping ? cloneCount - centerOffset : 0;
  const trackLength = looping ? count + cloneCount * 2 : Math.max(count, 1);
  const maxOffset = Math.max(0, trackLength - visible);

  const slideAt = (trackIndex: number) =>
    looping ? (((trackIndex - cloneCount) % count) + count) % count : trackIndex;

  const realIndex = (offset: number) => {
    if (!looping) return 0;
    return (((offset + centerOffset - cloneCount) % count) + count) % count;
  };

  const wrapOffset = (offset: number) => {
    if (!looping) return offset;
    if (offset >= baseOffset + count) return offset - count;
    if (offset < baseOffset) return offset + count;
    return offset;
  };

  const shortestDelta = (fromIndex: number, toIndex: number) => {
    const forward = (toIndex - fromIndex + count) % count;
    const backward = (fromIndex - toIndex + count) % count;
    return forward <= backward ? forward : -backward;
  };

  return {
    looping,
    cloneCount,
    centerOffset,
    baseOffset,
    trackLength,
    maxOffset,
    slideAt,
    realIndex,
    wrapOffset,
    shortestDelta,
  };
}
