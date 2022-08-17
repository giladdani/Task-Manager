import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

export default function SimpleSnackbar(props) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if(props.msg && props.msg.length > 0){
      setOpen(true)
    }
    else{
      setOpen(false);
    }
  }, [props.msg])

  const handleClose = (event, reason) => {
    setOpen(false);
  };

  return (
    <div>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={props.msg}
      />
    </div>
  );
}
