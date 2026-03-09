import { useMemo } from 'react';
import { FEATURES } from 'src/features';
import { DeliveryData, DeliveryDataKeys, DeliveryDataValue, DELIVERY_DATA } from 'src/data';
import { GoogleForm, Header, InService, Recipient, RecipientLine } from 'src/containers';
import { useSantaId } from 'src/hooks';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

type TargetUserData = DeliveryData | undefined;
type TargetEntry = [DeliveryDataKeys, DeliveryDataValue];

function App() {
  const santaId = useSantaId();

  const target: TargetUserData = DELIVERY_DATA?.get(santaId);

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
      <Header uid={santaId}/>

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
