import { PropsWithChildren } from 'react';
import { DeliveryData } from 'src/data';
import './Recipient.css'

interface RecipientProps {
  target?: DeliveryData;
};

const TEXTS = {
  err: 'Упс, не нашел твой ID. Обратись к админу',
  title: 'Адреса и пожелания получателя твоего подарка:',
};

const Recipient = ({ target, children }: PropsWithChildren<RecipientProps>) => {
  if (!target) return (
    <h2 className='ooops'>{TEXTS.err}</h2>
  )

  return (
    <div className='recipient'>
      <h2 className='recipient_header'>{TEXTS.title}</h2>
      {children}
    </div>
  )
}

export default Recipient;