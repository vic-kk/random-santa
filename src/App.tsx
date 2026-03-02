import { useMemo } from 'react';
import { FEATURES } from 'src/features';
import { DeliveryData, DeliveryDataKeys, DeliveryDataValue, DELIVERY_DATA } from 'src/data';
import { GoogleForm, Header, InService, Recipient, RecipientLine } from 'src/containers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

type TargetUserData = DeliveryData | undefined;

type TargetEntry = [DeliveryDataKeys, DeliveryDataValue];

const LS_KEY = 'SANTAUniqId';

const GenerateRandomSixDigitNumber = () => {
  return Math.floor(100000 + Math.random() * 900000);
}

function App() {
  if (!localStorage.getItem(LS_KEY)) {
    const randomNumber = GenerateRandomSixDigitNumber();
    localStorage.setItem(LS_KEY, `${randomNumber}`);
  }

  const number = parseInt((localStorage.getItem(LS_KEY) as string), 10);

  const target: TargetUserData = DELIVERY_DATA?.get(number);

  const RenderRecipientLines = useMemo(() => {
    if (!target) return null;

    return (Object.entries(target) as TargetEntry[]).map(([key, value]) => (
      <RecipientLine
        key={key}
        field={key}
        value={value}
      />
    ));
  }, [target]);

  return (
    <>
      <Header number={number}/>

      {FEATURES.IN_SERVICE && (
        <InService />
      )}

      {!FEATURES.IN_SERVICE && (
        <>
          {!FEATURES.SANTA_READY && (
            <GoogleForm/>
          )} 

          {FEATURES.SANTA_READY && (
            <Recipient target={target}>
              {RenderRecipientLines}
            </Recipient>
          )}
        </>
      )}

      <ToastContainer />
    </>
  )
}

export default App
