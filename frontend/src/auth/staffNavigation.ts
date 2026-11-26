import type { IconName } from '../components/Icon'
export type StaffLink = { path: string; label: string; icon: IconName }
export function staffLinks(type: string | null | undefined): StaffLink[] {
 const common: StaffLink[] = [{path:'',label:'Overview',icon:'dashboard'}]
 const items: Record<string, StaffLink[]> = {
 dentist:[{path:'/patients',label:'Find patient',icon:'users'},{path:'/history',label:'Clinical records',icon:'clipboard'},{path:'/imaging',label:'Imaging requests',icon:'scan'}],
 receptionist:[{path:'/patients',label:'Patient directory',icon:'users'},{path:'/patients/new',label:'Register patient',icon:'user-plus'},{path:'/billing',label:'Billing',icon:'credit-card'}],
 assistant:[{path:'/queue',label:'Daily appointments',icon:'calendar'}],
 radiologist:[{path:'/imaging',label:'Imaging worklist',icon:'scan'}]
 }
 return [...common,...(items[type || ''] || [])]
}
