export const filterStyle = ({ left, top, width, height, hide }: { left: number, top: number, width: number, height: number, hide: boolean }) => {
  return {
    background: '#ddeeff70',
    zIndex: '2147483647',
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    ...hide ? {
      height: '0', width: '0'
    } : {
      height: `${height}px`, width: `${width}px`,
    },
  }
}