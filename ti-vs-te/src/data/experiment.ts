/* The experiment: a fictional data-hall cooling loop that is overheating.
   Hidden cause: the bypass valve is stuck open, so coolant skips the heat
   exchanger. Ti moves build understanding but cost time; Te moves change the
   temperature but cannot aim at the real fault until something knows where it is. */

export type Who = 'ti' | 'te'

export type ActionId =
  | 't-define'
  | 't-model'
  | 't-contradict'
  | 't-derive'
  | 't-refine'
  | 'e-measure'
  | 'e-throttle'
  | 'e-pump'
  | 'e-fix'

export type Action = {
  id: ActionId
  who: Who
  label: string
  hint: string
  repeatable?: boolean
  needs?: ActionId
  needsUnderstanding?: number
  lockedLabel?: string
}

export const ACTIONS: Action[] = [
  { id: 't-define', who: 'ti', label: 'Define “overheating”', hint: 'Fix the term before reasoning with it.' },
  { id: 't-model', who: 'ti', label: 'Model the loop', hint: 'Where can heat enter and leave?', needs: 't-define' },
  { id: 't-contradict', who: 'ti', label: 'Look for a contradiction', hint: 'Which two facts cannot both be true?', needs: 't-model' },
  { id: 't-derive', who: 'ti', label: 'Derive the cause', hint: 'What must be the case?', needs: 't-contradict' },
  { id: 't-refine', who: 'ti', label: 'Refine the model further', hint: 'Make it more rigorous.', needs: 't-derive', repeatable: true },
  { id: 'e-measure', who: 'te', label: 'Measure every node', hint: 'Replace guesses with readings.' },
  { id: 'e-throttle', who: 'te', label: 'Throttle the load 30%', hint: 'Less work, less heat.', repeatable: true },
  { id: 'e-pump', who: 'te', label: 'Add a second pump', hint: 'More flow, more cooling?' },
  {
    id: 'e-fix',
    who: 'te',
    label: 'Close the bypass valve',
    hint: 'Act on the diagnosed cause.',
    needsUnderstanding: 75,
    lockedLabel: 'Fix the root cause',
  },
]

export const INSIGHT: Record<ActionId, string> = {
  't-define': 'Overheating isn’t “hot”. It is heat in > heat out. The load hasn’t changed — so less heat is leaving.',
  't-model': 'Heat can leave the loop in exactly one place: the exchanger. So the question becomes: is the coolant reaching it?',
  't-contradict': 'The pump reports 100% flow. The exchanger sees 55%. Both cannot be true — unless coolant is taking another route.',
  't-derive': 'There is only one other route: the bypass. The valve must be stuck open. The fault is routing, not capacity.',
  't-refine': 'Model v2: valve hysteresis, pipe expansion, a proof that the proof holds. Correct, elegant — and the room is still heating.',
  'e-measure': 'Racks at 88°C. Pump 100%. Exchanger inflow only 55%. The numbers disagree with each other.',
  'e-throttle': 'Cooler — and 30% of requests are now being turned away.',
  'e-pump': 'Temperature dips. More flow… most of it pushed straight through the same short-cut. It will creep back.',
  'e-fix': 'Valve closed. Full flow reaches the exchanger. The loop starts shedding heat on its own.',
}

export const GAIN: Partial<Record<ActionId, number>> = {
  't-define': 20,
  't-model': 25,
  't-contradict': 30,
  't-derive': 25,
  'e-measure': 10,
}

export const START = 88
export const SHUTDOWN = 100
export const TARGET = 72
export const HOURS = 7

export type Status = 'running' | 'solved' | 'shutdown' | 'timeout'
export type Entry = { id: ActionId; who: Who; hour: number; temp: number }

export type State = {
  hour: number
  temp: number
  understanding: number
  throughput: number
  pumps: number
  valveClosed: boolean
  rebound: number
  refines: number
  done: ActionId[]
  log: Entry[]
  status: Status
}

export const initial: State = {
  hour: 0,
  temp: START,
  understanding: 0,
  throughput: 100,
  pumps: 1,
  valveClosed: false,
  rebound: 0,
  refines: 0,
  done: [],
  log: [],
  status: 'running',
}

export function available(s: State, a: Action) {
  if (s.status !== 'running') return false
  if (!a.repeatable && s.done.includes(a.id)) return false
  if (a.needs && !s.done.includes(a.needs)) return false
  if (a.needsUnderstanding && s.understanding < a.needsUnderstanding) return false
  return true
}

export function step(s: State, id: ActionId): State {
  const a = ACTIONS.find((x) => x.id === id)!
  if (!available(s, a)) return s
  let { temp, understanding, throughput, pumps, valveClosed, rebound, refines } = s

  understanding = Math.min(100, understanding + (GAIN[id] ?? 0))
  if (id === 't-refine') refines += 1
  if (id === 'e-throttle') {
    temp -= 9
    throughput = Math.max(10, throughput - 30)
  }
  if (id === 'e-pump') {
    temp -= 6
    pumps = 2
    rebound = 5
  } else if (rebound) {
    temp += rebound
    rebound = 0
  }
  if (id === 'e-fix') {
    temp -= 20
    valveClosed = true
    throughput = 100
  }
  temp += valveClosed ? -4 : 2

  const hour = s.hour + 1
  const status: Status =
    temp >= SHUTDOWN ? 'shutdown' : valveClosed && temp <= TARGET ? 'solved' : hour >= HOURS ? 'timeout' : 'running'

  return {
    hour,
    temp: Math.min(SHUTDOWN, temp),
    understanding,
    throughput,
    pumps,
    valveClosed,
    rebound,
    refines,
    done: s.done.includes(id) ? s.done : [...s.done, id],
    log: [...s.log, { id, who: a.who, hour, temp: Math.min(SHUTDOWN, temp) }],
    status,
  }
}

export function verdict(s: State) {
  const ti = s.log.filter((e) => e.who === 'ti').length
  const te = s.log.length - ti
  if (s.status === 'solved')
    return {
      head: `Solved in ${s.hour} hours.`,
      body: `${ti} Ti moves found the target; ${te} Te move${te === 1 ? '' : 's'} hit it. Neither alone could have done both.`,
    }
  if (s.status === 'shutdown')
    return s.understanding >= 75
      ? {
          head: 'Shutdown. With a correct diagnosis.',
          body: `You knew exactly what was wrong${s.refines ? ` — model v${s.refines + 1}` : ''}. Nobody closed the valve. Understanding: ${s.understanding}%. Servers online: 0.`,
        }
      : {
          head: 'Shutdown.',
          body: 'The room crossed 100°C before anything touched the cause.',
        }
  return {
    head: 'Held down by force.',
    body: `The window closed at ${s.temp}°C with throughput at ${s.throughput}%. The valve is still open. It will happen again next week.`,
  }
}
