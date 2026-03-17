import { EXTERNAL_LINKS } from 'src/data';
import { useSantaId } from 'src/hooks';
import './GoogleForm.css'

function processGoogleFormUrl(url: string, uid: string) {
  return url.includes('pp_url&entry') ? url.concat(uid) : url;
}

const GoogleForm = () => {
  const uid = useSantaId();

  return (
    <iframe className='form' src={processGoogleFormUrl(EXTERNAL_LINKS.googleForm, uid)}>Загрузка…</iframe>
  )
}

export default GoogleForm;