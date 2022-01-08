export const getClientRect=(element: HTMLElement)=>{
   const { height, width, left: el, top: et } = (element as HTMLElement).getBoundingClientRect(),
    { left: bl, top: bt } = document.body.getBoundingClientRect(),
    top = et - bt,
    left = el - bl
    return {height, width, top, left}
}