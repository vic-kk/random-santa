import { PropsWithChildren } from 'react';
import { copyToClipboard } from 'src/utils';
import './CopyToClipboard.css'

interface CopyToClipboardProps {
  title?: string;
  successMessage?: string;
  copyValue: string;
  showEmoji?: boolean;
};

const CopyToClipboard = ({
  title = 'Нажми, чтобы скопировать',
  successMessage,
  copyValue,
  showEmoji,
  children
}: PropsWithChildren<CopyToClipboardProps>) => {
  const copyСonfig = {
    successMessage: successMessage,
  }

  const clickHandler = () => copyToClipboard(copyValue, copyСonfig)

  return (
    <span
      className='clickable'
      onClick={() => clickHandler()}
      title={title}
    >
      {showEmoji && <span>⿻&nbsp;</span>}
      {children}
    </span>
  )
}

export default CopyToClipboard;