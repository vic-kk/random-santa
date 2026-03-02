import { URLS } from 'src/data';
import './GoogleForm.css'

const GoogleForm = () => {
  return (
    <iframe className='form' src={URLS.googleForm}>Загрузка…</iframe>
  )
}

export default GoogleForm;