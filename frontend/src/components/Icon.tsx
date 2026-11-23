import type { SVGProps, ReactNode } from 'react'

export type IconName =
  | 'tooth' | 'dashboard' | 'calendar' | 'users' | 'user-plus' | 'doctor'
  | 'shield' | 'clipboard' | 'settings' | 'logout' | 'menu' | 'close'
  | 'arrow-right' | 'arrow-up-right' | 'chevron-down' | 'heart'
  | 'file' | 'credit-card' | 'scan' | 'pill' | 'clock' | 'check'
  | 'sparkles' | 'mail' | 'lock' | 'building' | 'activity' | 'chair'

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

/** Lightweight in-project SVG icons; no external icon dependency. */
export default function Icon({ name, size = 20, ...rest }: Props) {
  const paths: Record<IconName, ReactNode> = {
    tooth: <><path d="M7.5 3.1c-2.4-.6-4.3 1-4.3 4.3 0 2.6 1.2 4.4 2 6.9.8 2.7 1.2 6.6 3.3 6.6 1.8 0 1.3-4.6 3.5-4.6s1.7 4.6 3.5 4.6c2.1 0 2.5-3.9 3.3-6.6.8-2.5 2-4.3 2-6.9 0-3.3-1.9-4.9-4.3-4.3-1.7.4-2.7 1.3-4.5 1.3s-2.8-.9-4.5-1.3Z"/></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3m4 0h2"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></>,
    'user-plus': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m10-11V6m-2 2h4m4-4v8m-4-4h8"/><circle cx="9" cy="7" r="4"/></>,
    doctor: <><path d="M6 3v5a4 4 0 0 0 8 0V3m-8 0H4m10 0h2M10 12v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    clipboard: <><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6m-6 4h6m-6 4h4"/></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.07.07-1.88 1.88-.07-.07a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.66V21h-2.66v-.82a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-2 .36l-.07.07-1.88-1.88.07-.07a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.66-1.1H5v-2.66h.82a1.8 1.8 0 0 0 1.66-1.1 1.8 1.8 0 0 0-.36-2l-.07-.07 1.88-1.88.07.07a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1.1-1.66V4h2.66v.82a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 2-.36l.07-.07 1.88 1.88-.07.07a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.66 1.1H21v2.66h-.82A1.8 1.8 0 0 0 19.4 15Z"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="M5 5l14 14M19 5 5 19"/></>,
    'arrow-right': <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    'arrow-up-right': <><path d="M7 17 17 7M8 7h9v9"/></>,
    'chevron-down': <><path d="m6 9 6 6 6-6"/></>,
    heart: <><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/></>,
    file: <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5M9 13h6m-6 4h6"/></>,
    'credit-card': <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20m-15 5h5"/></>,
    scan: <><path d="M4 9V5a1 1 0 0 1 1-1h4m6 0h4a1 1 0 0 1 1 1v4m0 6v4a1 1 0 0 1-1 1h-4m-6 0H5a1 1 0 0 1-1-1v-4M4 12h16"/></>,
    pill: <><path d="M10.5 3.5a5.5 5.5 0 0 1 7.8 7.8l-7 7a5.5 5.5 0 0 1-7.8-7.8Zm-3.5 4 9 9"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    sparkles: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM4 2l.7 2.3L7 5l-2.3.7L4 8l-.7-2.3L1 5l2.3-.7L4 2Z"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></>,
    lock: <><rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4m-4 5v2"/></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2m-6 6v-3h8v3"/></>,
    activity: <><path d="M3 12h4l3-7 4 14 3-7h4"/></>,
    chair: <><path d="M6 4v10h12V4M4 14h16m-14 0v7m12-7v7M7 4h10"/></>,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true" {...rest}>
    {paths[name]}
  </svg>
}
