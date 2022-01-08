// import '@fontsource/roboto/300.css';
// import '@fontsource/roboto/400.css';
// import '@fontsource/roboto/500.css';
// import '@fontsource/roboto/700.css';
import { listenerRegister } from './content_script/listenerRegister'
import ReactDOM from "react-dom";
import React, { useEffect, useRef, useState } from 'react'
import { dragElement } from './content_script/dragElement';
import { menuStyle } from './content_script/menuStyle';
import { CONFIRM_ID, FILTER_ID, HEADER_HEIGHT, MENU_HEADER_ID, MENU_ID } from './content_script/const';
import { v4 } from 'uuid';
import { getDomSelectorStatus, setDomSelectorStatus } from './content_script/chromeStorage/domSelector';
import { getWorkflows, Workflow, setWorkflows, WorkflowStep } from './content_script/chromeStorage/workflows';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { delay } from './content_script/delay';
import { filterStyle } from './content_script/filterStyle';
import { getClientRect } from './content_script/getClientRect';
import { getWorkflowInstance, setWorkflowInstance } from './content_script/chromeStorage/workflowInstance';
import rfdc from 'rfdc';
import { Control, SubmitHandler, useFieldArray, useForm, useFormContext, UseFormGetValues, UseFormRegister, UseFormUnregister, useWatch } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import { Input } from '@mui/material';

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.color) {
    console.log("Receive color = " + msg.color);
    document.body.style.backgroundColor = msg.color;
    sendResponse("Change color to " + msg.color);
  } else {
    sendResponse("Color message is none.");
  }
});


const DragHeader = () => {
  return (
    <div id={MENU_HEADER_ID} style={{
      height: HEADER_HEIGHT,
      cursor: 'move',
      background: '#e1e1e1',
      borderBottom: '1px solid #b6b6b6',
      borderRadius: '5px 5px 0 0',
      display: 'flex',
      alignItems: 'center',
      position: 'fixed',
      width: 'inherit',
    }}>
      <Typography>head</Typography>
    </div>
  )
}

const filter = document.createElement('filter')
filter.id = FILTER_ID
document.body.appendChild(filter)
const confirmEl = document.createElement('confirm')
confirmEl.id = CONFIRM_ID
document.body.appendChild(confirmEl)

type Inputs = {
  workflows: Workflow[],
};

const MenuWindow = () => {
  const [selectorStatus, setSelectorStatus] = useState<'on' | "off">()
  const [recording, setRecording] = useState<{ status: boolean, workflowId: string, stepId: string, mode: 'altshift'|'default' }>({ status: false, workflowId: '', stepId: '', mode: 'default' })
  const [cssSelector, setCssSelector] = useState<string>('')
  const [step, setStep] = useState(-1)
  const [run, setRun] = useState(false)
  const [ws, setWs]=useState<Workflow[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const any = useRef<{ w?: Workflow, s?: WorkflowStep, e?: HTMLElement, repeat?: number }>({})
  const open = Boolean(anchorEl);
  // const keydownFunction = React.useCallback(({altKey, shiftKey}: KeyboardEvent) => {
  //   if (altKey && shiftKey && recording.mode === 'altshift') {
  //     shiftalt.current = true
  //   }
  // }, []);
  // const keyupFunction = React.useCallback(({altKey, shiftKey}: KeyboardEvent) => {
  //   if (!altKey && !shiftKey) {
  //     shiftalt.current = false
  //   }
  // }, []);
  useEffect(() => {
    (async () => {
      // document.addEventListener("keydown", keydownFunction, false);
      // document.addEventListener("keyup", keyupFunction, false);
      listenerRegister(setCssSelector)
      setSelectorStatus(await getDomSelectorStatus())
      const ws = await getWorkflows()
      console.log(ws)
      setWs(ws)
      setRun(Boolean((await getWorkflowInstance())?.steps.length))
      const el = document.getElementById(MENU_ID)
      if (!el) throw Error('定義してください')

      dragElement(el)
    })()
  }, [])
  useEffect(() => {
    (async () => {
      console.log(cssSelector)
      if (!recording.status || !recording.stepId || !recording.workflowId) return
      
      const { height, width, left, top } = getClientRect(filter)
      Object.assign(filter.style, filterStyle({
        left, top, height, width, hide: true,
      }))

      await setWorkflows(
        ws.map((w, i) => {
          if (w.id === recording.workflowId) {
            w.steps = w.steps.map((s, ii) => {
              if (s.id === recording.stepId) {
                s.selector = cssSelector
              }
              return s
            })
          }
          return w
        })
      )
      setRecording({
        status: false,
        stepId: '',
        workflowId: '',
        mode: 'default',
      })
      setSelectorStatus('off')
      await setDomSelectorStatus('off')
    })()
  }, [cssSelector])
  useEffect(() => {
    (() => {
      console.log({run})
      if (!run) return

      setStep(0)
    })()
  }, [run])
  useEffect(() => {
    (async () => {
      if (!run) return

      console.log(step)
      switch (step) {
        case -1: {
          console.log('end')
          break;
        }
        case 0: {
          const workflow = await getWorkflowInstance()
          if (!workflow) {
            setStep(-1)
            any.current = {}
            break
          }
          any.current.w = workflow
          setStep(1)
          break;
        }
        case 1: {
          if (any.current.w?.steps.length === 0) {
            setStep(-1)
            any.current = {}
            break
          }
          any.current.s = any.current.w?.steps[0]
          setStep(2)
          break;
        }
        case 2:
        case 3: {
          // mustacheというパッケージを使って埋め込めるようにしたい
          if (typeof any.current.s?.selector !== 'string') {
            setStep(1)
            break
          }
          any.current.e = document.querySelector(any.current.s?.selector) as HTMLElement
          if (any.current.e === null) {
            typeof any.current.repeat === 'number' ? any.current.repeat++ : any.current.repeat = 1
            await delay(2000)
            setStep(step === 2 ? 3 : 2)
            break
          }
          any.current.repeat = 0;
          setStep(4);
          break;
        }
        case 4: {
          if (any.current.e === undefined) {
            setStep(2)
            break
          }
          const { height, width, left, top } = getClientRect(any.current.e)
          Object.assign(confirmEl.style, filterStyle({
            left, top, height, width, hide: false,
          }))
          setAnchorEl(confirmEl)
          setStep(5)
          break;
        }
        case 5:
        case 6: {
          if (anchorEl === null) {
            typeof any.current.repeat === 'number' ? any.current.repeat++ : any.current.repeat = 1
            await delay(2000)
            setStep(step === 5 ? 6 : 5)
            break;
          }
          any.current.repeat = 0;
          setStep(7)
          break;
        }
        case 7:
        case 8: {
          if (anchorEl !== null) {
            typeof any.current.repeat === 'number' ? any.current.repeat++ : any.current.repeat = 1
            await delay(2000)
            setStep(step === 7 ? 8 : 7)
            break;
          }
          any.current.repeat = 0;
          if (any.current.e === undefined) {
            setStep(2)
            break
          }
          const { height, width, left, top } = getClientRect(any.current.e)
          Object.assign(confirmEl.style, filterStyle({
            left, top, height, width, hide: true,
          }))
          setStep(9)
          break;
        }
        case 9: {
          const {e, s, w} = any.current
          if (e === undefined) {
            setStep(2)
            break
          }
          if (s === undefined) {
            setStep(1)
            break
          }
          if (w === undefined) {
            setStep(0)
            break
          }
          const i = { ...w, steps: w.steps.filter((_, i) => i) }
          console.log({i})
          await setWorkflowInstance(i)
          if (i.steps.length === 0) {
            setRun(false)
            setStep(-1)
          } else {
            setStep(0)
          }
          
          console.log({s})
          if (s.type ==='input') {
            const valueSetter = Object.getOwnPropertyDescriptor(e, 'value')?.set;
            const prototype = Object.getPrototypeOf(e);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            console.log(valueSetter, prototypeValueSetter)
            valueSetter?.call(e, s.inputValue);
            prototypeValueSetter?.call(e, s.inputValue);
            e.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          } else {
            console.log(e.tagName)
            if (typeof s.event === 'string') {
              e.dispatchEvent(new Event(s.event, {bubbles: true, cancelable: true}));
            } else {
              e.click()
            }
          }
          break;
        }
        default:
          break;
      }
    })()
  }, [step])

  const handleClick = async () => {
    if (await getDomSelectorStatus() === 'off') {
      await setDomSelectorStatus('on')
      setSelectorStatus('on')
    } else {
      await setDomSelectorStatus('off')
      setSelectorStatus('off')
    }
  }

  const handleRunWorkflow = async (id: string) => {
    const w = ws.find(w => w.id === id)
    if (w === undefined) return

    await setWorkflowInstance(rfdc()(w))
    setRun(true)
  }
  
  const handleStopWorkflow = async(id: string) => {
    await setWorkflowInstance({id: '', steps: []})
    setStep(-1)
    setRun(false)
  }

  const handleRecording = async (e: React.MouseEvent, workflowId: string, stepId: string) => {
    e.preventDefault()
    await setDomSelectorStatus('on')
    setSelectorStatus('on')
    setRecording({
      status: true,
      workflowId,
      stepId,
      mode: e.altKey && e.shiftKey ? 'altshift':'default'
    })
  }

  const handleClose = () => {
    setAnchorEl(null)
  };
  return <Box style={{ display: 'flex', flexDirection: 'column', width: 'inherit' }}>
    <DragHeader />
    <div style={{ width: 'inherit', height: HEADER_HEIGHT }} />
    <div style={{ height: '100%' }}>
      <Button size="small" onClick={handleClick}>selector:{selectorStatus}</Button>
      <Workflows recordingStatus={recording.status} ws={ws} handleRecording={handleRecording} handleStopWorkflow={handleStopWorkflow} handleRunWorkflow={handleRunWorkflow} run={run} setWs={setWs}/>
    </div>
    <Menu
      id="basic-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        'aria-labelledby': 'basic-button',
      }}
    >
      <MenuItem onClick={handleClose}>{any.current.s?.type === 'input' ? '入力':'クリック'}を許可</MenuItem>
    </Menu>
  </Box>
}

type WorkflowsProps = {
  ws: Workflow[]
 setWs: React.Dispatch<React.SetStateAction<Workflow[]>>
 handleRunWorkflow: (id: string) => Promise<void>
 handleStopWorkflow: (id: string) => Promise<void>
 run: boolean;
 handleRecording: (e: React.MouseEvent, workflowId: string, stepId: string) => Promise<void>
 recordingStatus: boolean
}

const Workflows = ({recordingStatus,ws, setWs, handleRecording, handleRunWorkflow, handleStopWorkflow, run}: WorkflowsProps) => {
  const handleAddWorkflow = async () => {
    (async (w) => {
      await setWorkflows(w)
      setWs(w)
    })([...ws, {
      id: v4(),
      steps: [
        {
          id: v4(),
          selector: '',
          type: '',
          inputValue: '',
        } as WorkflowStep
      ]
    }])
  }
  const handleDeleteWorkflow = async (id: string) => {
    return (async (ws) => {
      await setWorkflows(ws)
      setWs(ws)
    })(ws.filter(w => w.id !== id))
  }
  return <>
    <Button size="small" onClick={handleAddWorkflow}>new</Button>
    {
      ws.map((w, i) => {
        return <div key={w.id}>
          {i}
          <Button size="small" onClick={() => {
            handleDeleteWorkflow(w.id)
          }}>X</Button>
          {run ?<Button size="small" onClick={() => handleStopWorkflow(w.id)}>stop</Button>: <Button size="small" onClick={() => handleRunWorkflow(w.id)}>run</Button>}
          <WorkflowSteps setWs={setWs} steps={w.steps} handleRecording={handleRecording} workflowId={w.id} workflows={ws} recordingStatus={recordingStatus} />
        </div>
      })
    }
  </>
}

type WorkflowStepsProps = {
  setWs: React.Dispatch<React.SetStateAction<Workflow[]>>
  workflowId: string
  workflows: Workflow[]
  handleRecording: (e: React.MouseEvent, workflowId: string, stepId: string) => Promise<void>
  recordingStatus: boolean
  steps: WorkflowStep[]
}

const WorkflowSteps = ({setWs,steps, workflowId, workflows, handleRecording, recordingStatus }: WorkflowStepsProps) => {
  const handleAddStep = () => {
    return (async (ws) => {
      setWs(ws)
      await setWorkflows(ws)
    })(workflows.map(w => {
      if (w.id === workflowId) {
        w.steps = [...w.steps, { id: v4(), selector: '', type: '' }as WorkflowStep]
      }
      return w
    }))
  }
  const handleDeleteStep = (stepId: string, i: number) => {
    return (async (ws) => {
      await setWorkflows(ws)
      setWs(ws)
    })(workflows.map(w => {
      if (w.id === workflowId) {
        w.steps = w.steps.filter(s => s.id !== stepId)
      }
      return w
    }))
  }
  return <>
    {steps.map((s, i) => {
      return     <div key={s.id}>
      <Input
        size='small'
          onChange={async (e)=>{
            const step = workflows.find(w => w.id === workflowId)?.steps.find(ss => ss.id === s.id)
            if (step ===  undefined)return

            step.selector = e.target.value
            await setWorkflows(workflows)
            setWs(workflows)
          }}
          required
          defaultValue={s.selector}
        />
      <Select
      size="small"
        required
        onChange={async(e) => {
          const ws = workflows.map(w => {
            if (w.id === workflowId) {
              w.steps = w.steps.map(ss => {
                if (ss.id === s.id) {
                  if (['', 'click', 'input'].includes(e.target.value)) {
                    ss.type = e.target.value as WorkflowStep['type']
                  }
                }
                return ss
              })
            }
            return w
          })
          setWs(ws)
          await setWorkflows(ws)
        }}
        defaultValue={s.type}
        value={s.type}
      >
        <MenuItem value=""></MenuItem>
        <MenuItem value="click">click</MenuItem>
        <MenuItem value="input">input</MenuItem>
      </Select>
        <Input
        size='small'
          onChange={async (e)=>{
            const step = workflows.find(w => w.id === workflowId)?.steps.find(ss => ss.id === s.id)
            if (step ===  undefined)return

            step.inputValue = e.target.value
            await setWorkflows(workflows)
            setWs(workflows)
          }}
          required
          defaultValue={s.inputValue}
          disabled={s.type !== 'input'}
        />
      <Input
        size='small'
          onChange={async (e)=>{
            const step = workflows.find(w => w.id === workflowId)?.steps.find(ss => ss.id === s.id)
            if (step ===  undefined)return

            step.event = e.target.value
            await setWorkflows(workflows)
            setWs(workflows)
          }}
          required
          defaultValue={s.event}
        />
      <Button size="small" onClick={() => handleDeleteStep(s.id, i)}>X</Button>
      <Button size="small" onClick={(e) => handleRecording(e, workflowId, s.id)}>record:{recordingStatus ? 'on' : 'off'}</Button>
    </div>
    })}
    <div>
      <Button size="small" onClick={handleAddStep}>+</Button>
    </div>
  </>
}

const menu = document.createElement('div')
menu.id = MENU_ID
Object.assign(menu.style, menuStyle)
document.body.appendChild(menu)
ReactDOM.render(React.createElement(MenuWindow, {}), menu)
