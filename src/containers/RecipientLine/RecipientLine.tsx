import { CopyToClipboard } from 'src/containers';
import { DeliveryData, DeliveryDataKeys } from 'src/data';
import './RecipientLine.css'

type Links = Record<Exclude<DeliveryDataKeys, 'gender' | 'wishes'> , string>

interface RecipientLineProps {
  field: DeliveryDataKeys;
  value: string;
}

const LINKS: Links = {
  ozon_address: 'https://www.ozon.ru/',
  wb_address: 'https://www.wildberries.ru/',
}

const TITLES: DeliveryData = {
  gender: 'Твой получатель',
  wishes: 'Пожелания',
  ozon_address: 'OZON',
  wb_address: 'WB',
}

function isLinkKey(key: keyof DeliveryData): key is keyof Links {
  return key in LINKS;
}

const RecipientLine = ({ value, field }: RecipientLineProps) => {
  const isDeliveryLink = isLinkKey(field);
  const deliveryClass = isDeliveryLink ? field : '';

  return (
    <div className='recipient-line'>
      <div className="title">
        {!isDeliveryLink &&
          `${TITLES[field]}:`
        }

        {isDeliveryLink && (
          <a
            className={deliveryClass}
            href={LINKS[field]}
            title={`Перейти на сайт ${TITLES[field]}`}
            target='_blank'
          >
              {TITLES[field]}:
          </a>
        )}
      </div>
            
      {!isDeliveryLink && (
        <div>{value || "-"}</div>
      )}

      {isDeliveryLink && (
        <CopyToClipboard
          copyValue={value}
          successMessage={`Адрес ${TITLES[field]} скопирован`}
          showEmoji
        >
          {value}
        </CopyToClipboard>
      )}
    </div>
  )
}

export default RecipientLine;