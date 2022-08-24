import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MultipleSelectChip from '../MultipleSelectChip';
import Select from '@mui/material/Select';

/**
 * 
 * @param {*} props Includes:
 * User Email
 * Array of selected tags
 * @returns 
 */


export default function TagDialog(props) {
    const [title, setTagName] = useState("");
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

    const handleCreate = () => {

    }

    const handleCancel = () => {
    }

    return (
        <>
            <Dialog open={props.isOpen} aria-labelledby="draggable-dialog-title" PaperComponent={PaperComponent} BackdropProps={{ style: { backgroundColor: "transparent" } }} disableScrollLock disableRestoreFocus>
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">Edit tags</DialogTitle>
                <DialogContent>
                    <table>
                        <tbody>
                            <tr>
                                <td>Tags:</td>
                            </tr>
                            <tr>
                                <td>
                                    <MultipleSelectChip items={selectedTags}></MultipleSelectChip>
                                </td>
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
                                    <TextField label="Tag name" value={title} onChange={(newValue) => setTagName(newValue.target.value)} size="small" autoFocus />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} variant="contained" color="secondary">Cancel</Button>
                    <Button onClick={handleCreate} variant="contained" color="primary">Create New</Button>
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