import { useMemo } from 'react';
import { FEATURES } from 'src/features';
import { DeliveryData, DeliveryDataKeys, DeliveryDataValue, DELIVERY_DATA } from 'src/data';
import { IntegratedForm, Header, InService, Recipient, RecipientLine, Snow } from 'src/containers';
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
      <Header/>

      {FEATURES.IN_SERVICE && (
        <InService />
      )}

      {!FEATURES.IN_SERVICE && (
        <>
          {!FEATURES.SANTA_READY && (
            <IntegratedForm/>
          )} 

          {FEATURES.SANTA_READY && (
            <Recipient target={target}>
              {RenderRecipientLines}
            </Recipient>
          )}
        </>
      )}

      <Snow />

      <ToastContainer />
    </>
  )
}

export default App
