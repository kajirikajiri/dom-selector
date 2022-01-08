import { getDomSelectorStatus } from "./chromeStorage/domSelector"
import { getCssPath } from "./getCssPath"
import { CONFIRM_ID, FILTER_ID, MENU_ID } from "./const"
import { filterStyle } from "./filterStyle"
import { getClientRect } from "./getClientRect"

export const listenerRegister = (setCssSelector: React.Dispatch<React.SetStateAction<string>>) =>{
    let mousedown = false
    const mouseupListener = () => {
        mousedown = false
      }
      const mousedownListener = () => {
        mousedown = true
      }
      const mousemoveListener = async ({ clientX, clientY, shiftKey, altKey }: MouseEvent) => {
        const filter = document.getElementById(FILTER_ID)
        if (!filter) return
    
        const elements = document.elementsFromPoint(clientX, clientY)
        // mousedown中は非表示にする。Menu画面のresize時のmousedownを想定
        // elements.length <= 2はHTMLタグとFILTERタグのみまたはHTMLタグのみが検出された場合を想定
        // MENU画面の上をhoverしている時は非表示になることを想定
        const hide = !(altKey && shiftKey) && (mousedown || elements.length <= 2 || elements.some(e => e && (e as HTMLElement).id === MENU_ID) || await getDomSelectorStatus() === 'off'),
            depth = Object.is(filter, elements[0]) ? 1 : 0,
            {top, left, height, width} = getClientRect(elements[depth] as HTMLElement)
        Object.assign(filter.style, filterStyle({
            left, top, height, width, hide,
        }))
      }
      const clickListener = ({clientX, clientY}: MouseEvent) => {
        const elements = document.elementsFromPoint(clientX, clientY)
        const a = elements.reduce((pv, cv, i) => [MENU_ID, FILTER_ID, CONFIRM_ID].includes(cv.id) ? i : pv, -1)
        if (a > -1) {
            elements.splice(0, a + 1)
        }

        setCssSelector(getCssPath(elements[0]) ?? '')
      }
      document.addEventListener('mouseup', mouseupListener)
      document.addEventListener('mousedown', mousedownListener)
      document.addEventListener('mousemove', mousemoveListener)
      document.addEventListener('click', clickListener)
}
