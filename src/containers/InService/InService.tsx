import './InService.css'

const InService = () => {
  const isDecember = new Date().getMonth() === 11;

  return (
    <p className='in_service'>{isDecember ? "Эльфы в работе" : "Эльфы в отпуске до декабря"}</p>
  )
}

export default InService;