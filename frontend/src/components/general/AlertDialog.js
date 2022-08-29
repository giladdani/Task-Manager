import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

/**
 * 
 * @param {*} props 
 * * open
 * * title
 * * text
 * * setOpen(Boolean)
 * * onConfirm()
 * @returns 
 */
export default function AlertDialog(props) {
    const handleClose = () => {
        props.setOpen(false)
    };

    const handleConfirm = () => {
        handleClose();

        if (props.onConfirm) {
            props.onConfirm();
        }
    }

    return (
        <div>
            <Dialog
                open={props.open}
                // onClose={handleCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {props.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {props.text}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirm}>OK</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}