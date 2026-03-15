import santaLogo from '/santa-250.webp'
import { URLS } from 'src/data';
import { CopyToClipboard } from 'src/containers';
import './Header.css'

interface HeaderProps {
  uid: string;
};

const Header = ({ uid }: HeaderProps) => {
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
        <div>
          <a className='tg' href={URLS.tgAdmin} target='_blank'>группа в TG</a>
        </div>
      </div>
    </div>
  )
}

export default Header;