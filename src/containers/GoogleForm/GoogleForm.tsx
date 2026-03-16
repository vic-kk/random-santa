import { URLS } from 'src/data';
import { useSantaId } from 'src/hooks';
import './GoogleForm.css'

const GoogleForm = () => {
  const uid = useSantaId();

  return (
    <iframe className='form' src={URLS.googleForm+uid}>Загрузка…</iframe>
  )
}

export default GoogleForm;