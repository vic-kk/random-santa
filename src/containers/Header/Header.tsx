import santaLogo from '/santa-250.webp'
import { EXTERNAL_LINKS, TLinkItem } from 'src/data';
import { CopyToClipboard } from 'src/containers';
import { useSantaId } from 'src/hooks';
import './Header.css'

const Header = () => {
  const uid = useSantaId();

  const { url, text } = EXTERNAL_LINKS.get('community') as TLinkItem;

  return (
    <div className='santa-header'>
      <div>
        <img src={santaLogo} className="logo" width={250} height={250} alt="santa logo" />
      </div>
      <div>
        <div className='title'>
          Твой уникальный номер:
        </div>
        <CopyToClipboard
          copyValue={uid}
          successMessage='Ваш номер скопирован'
        >
          <span className="number">{uid}</span>
        </CopyToClipboard>
        <div>
          Твой номер уже сохранен на этой странице, но, <br/>
          на всякий случай, <u><b>сфотографируй</b></u> или <u><b>запиши его</b></u>
        </div>
        {url && (
          <div>
            <a className='tg' href={url} target='_blank' title={text}>{text}</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default Header;