import { useParams } from 'react-router'

const labels: Record<string,string> = {
  'treatment-plans':'Treatment Plans','prescriptions':'Prescriptions','billing':'Billing & Payments','imaging':'Dental Imaging'
}
export default function ModulePending(){
  const {section=''}=useParams()
  return <div className="panel"><h1>{labels[section]??'Module'}</h1><p>This patient portal section is reserved for its corresponding team module.</p><p>Patient data must be loaded from its own protected backend endpoint after team integration, not hardcoded or read by arbitrary patient ID.</p></div>
}
