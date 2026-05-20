import { EXTERNAL_LINKS, TLinkItem } from 'src/data';
import { useSantaId } from 'src/hooks';
import './IntegratedForm.css'

function processFormUrl(url: string, uid: string) {
  return url.includes('pp_url&entry') ? url.concat(uid) : url;
}

const IntegratedForm = () => {
  const uid = useSantaId();

  const { url, text } = EXTERNAL_LINKS.get('santa_form') as TLinkItem;

  return (
    <iframe className='form' src={processFormUrl(url, uid)} title={text}>Загрузка…</iframe>
  )
}

export default IntegratedForm;