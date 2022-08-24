import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MultipleSelectChip from './MultipleSelectChip';
import Select from '@mui/material/Select';
const TagsAPI = require('../../apis/TagsAPI.js');
const APIUtils = require('../../apis/APIUtils.js')



/**
 * 
 * @param {*} props Includes:
 * User Email
 * Array of selected tags
 * @returns 
 */


export default function TagDialog(props) {
    const [allUserTags, setAllUserTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState(props.selectedTags);
    const [newTagTitle, setNewTagTitle] = useState("");

    useEffect(() => {
        fetchAndSetAllTags();
        markSelectedTags();
    }, [])

    useEffect(() => {
        markSelectedTags();
    }, [allUserTags])

    async function fetchAndSetAllTags() {
        TagsAPI.fetchTagsData()
            .then(tags => {
                setAllUserTags(tags);
            })
            .catch(err => {
                console.error(err);
                // TODO: notification error, get in props
            })
    }

    function markSelectedTags() {
        // TODO:
        // Mark all the selected tags from allUserTags
        // Update the selectChip component
    }

    function handleUpdate() {
        props.onTagsUpdate(selectedTags);
    }

    const handleCreate = () => {
        TagsAPI.createTag(newTagTitle)
        .then(response => {
            if (APIUtils.isValidStatus(response, TagsAPI.validStatusArr_createTag)) {
                fetchAndSetAllTags();
                markSelectedTags();
                // TODO: notification, get in props
            } else {
                // TODO: notification, get in props
            }

        })
        .catch(err => {
            console.error(err);
            // TODO: notification error, get in props
        })
    }

    const handleSave = () => {
        handleUpdate();
    }

    const handleCancel = () => {
        // TODO: change this to X to exit the dialog
    }

    const onSelectChange = (selected) => {
        setSelectedTags(selected);
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
                                    {/* <form> */}
                                    <MultipleSelectChip items={allUserTags} onSelectChange={onSelectChange}></MultipleSelectChip>
                                    {/* </form> */}
                                </td>
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