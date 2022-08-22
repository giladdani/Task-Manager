import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { SuggestedEventsList as SuggestedEventsList } from './SuggestedEventsList';


/**
 * 
 * @param {*} props Includes:
 * User Email
 * Array of selected tags
 * @returns 
 */


export default function TagDialog(props) {
    const [title, setEventName] = useState("");
    const [selectedTags, setSelectedTags] = useState(props.selectedTags);
    const [nonSelectedTags, setNonSelectedTags] = useState([]);

    useEffect(() => {
        fetchAndSetTags();
    }, [])

    async function fetchAndSetTags() {
        // Fetch all user tags
        //  Remove from them all selected tags
        // //  set them for the dual listbox component
        // setNonSelectedTags(data);
    }

    function handleUpdate(selectedTags) {
        // props.handleTagUpdate(selectedTags)
    }

    return (
        <>
            <Dialog open={props.isOpen} aria-labelledby="draggable-dialog-title" PaperComponent={PaperComponent} BackdropProps={{ style: { backgroundColor: "transparent" } }} disableScrollLock disableRestoreFocus>
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">Edit event</DialogTitle>
                <DialogContent>
                    <table id="editEventTable">
                        <tbody>
                            <tr>
                                {/* Dual ListBox
                                    handleUpdate={handleUpdate} 
                                    
                                    selected={selectedTags}
                                    nonSelected={nonSelectedTags}
                                    setSelected={setSelectedTags}
                                    setNonSelected={setNonSelectedTags}
                                    */}
                            </tr>
                            <tr>
                                <td>
                                    <TextField label="Event name" value={title} onChange={(newValue) => setEventName(newValue.target.value)} autoFocus />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} variant="contained" color="secondary">Create New</Button>
                    <Button onClick={handleSave} variant="contained" color="success">Add Existing</Button>
                </DialogActions>
                {/* All User Tags component */}
            </Dialog>
        </>
    );
}

// PaperComponent allows dragging the dialog
function PaperComponent(props) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}