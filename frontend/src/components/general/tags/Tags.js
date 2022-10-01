import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Draggable from 'react-draggable';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import CardActions from '@mui/material/CardActions';

import CardHeader from '@mui/material/CardHeader';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MultipleSelectChip from '../MultipleSelectChip';
import Select from '@mui/material/Select';

import AlertConfirmDialog from '../AlertConfirmDialog';


const TagsAPI = require('../../../apis/TagsAPI.js');
const APIUtils = require('../../../apis/APIUtils.js')



const ListItem = styled('li')(({ theme }) => ({
    margin: theme.spacing(0.5),
}));

export default function Tags(props) {
    const [selectedTagIds, setSeletedTagIds] = useState(props.selectedTagIds);
    const [allUserTags, setAllUserTags] = useState();
    const [selectedTags, setSelectedTags] = useState();

    const [newTagTitle, setNewTagTitle] = useState("");

    const [tagIdsToDelete, setTagIdsToDelete] = useState([]);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);


    useEffect(() => {
        fetchAndSetAllTags();
    }, [])

    const fetchAndSetAllTags = async () => {
        return TagsAPI.fetchTagsData()
            .then(tags => {
                setAllUserTags(tags);
            })
            .catch(err => {
                console.error(err);
                props.setNotificationMsg('Failed to fetch tags');
            })
    }

    useEffect(() => {
        findAndSetSelectedTags();
    }, [allUserTags])

    const findAndSetSelectedTags = () => {
        if (selectedTagIds && allUserTags) {
            let selectedTags = [];
            for (const selectedId of selectedTagIds) {
                let tag = allUserTags.find(tag => tag.id === selectedId);
                if (tag) selectedTags.push(tag);
            }

            setSelectedTags(selectedTags);
        }
    }

    const handleTagsUpdated = (selectedIds) => {
        setSeletedTagIds(selectedIds);
        props.onTagsUpdate(selectedIds);
    }

    const handleSelectChange = (selected) => {
        let selectedIds = [];

        if (selected) {
            for (const element of selected) {
                if (element.id) selectedIds.push(element.id);
            }
        }

        setSeletedTagIds(selectedIds);
        props.onTagsUpdate(selectedIds);
    }

    const handleDeleteSelectChange = (selected) => {
        let selectedIds = [];

        if (selected) {
            for (const element of selected) {
                if (element.id) selectedIds.push(element.id);
            }
        }

        setTagIdsToDelete(selectedIds);
        // props.onTagsUpdate(selectedIds);
    }

    const handleCreate = () => {
        if (!newTagTitle || newTagTitle.trim().length === 0) {
            props.setNotificationMsg("Cannot enter empty name.");
            return;
        }

        TagsAPI.createTag(newTagTitle)
            .then(response => {
                if (APIUtils.isValidStatus(response, TagsAPI.validStatusArr_createTag)) {
                    fetchAndSetAllTags();
                    // markSelectedTags();
                    props.setNotificationMsg("Tag created");
                } else {
                    props.setNotificationMsg("Failed to create, name must be unique"); // TODO: get the server response?
                }
            })
            .catch(err => {
                console.error(err);
                props.setNotificationMsg("Failed to create"); // TODO: get the server response?
            })
    }

    const handleDelete = () => {
        setDeleteConfirmDialogOpen(true);
    }

    const handleConfirmDelete = () => {
        if (!tagIdsToDelete || tagIdsToDelete.length === 0) {
            props.setNotificationMsg("No tags chosen to delete");
            return;
        }

        TagsAPI.deleteTags(tagIdsToDelete)
        .then(res => {
            if(APIUtils.isValidStatus(res, TagsAPI.validStatusArr_deleteTags)) {
                props.setNotificationMsg("Tags deleted");
            } else {
                props.setNotificationMsg("Problem with deleting tags");
            }
        })
        .catch(err => {
            console.error(err);
            props.setNotificationMsg("Failed to delete tags");
        })
    }

    const handleDeleteDialogOpen = (openState) => {
        setDeleteConfirmDialogOpen(openState);
    }

    return (
        <>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <MultipleSelectChip label="Tags" items={allUserTags} selectedItems={selectedTags} onSelectChange={handleSelectChange} disabled={props.disabled} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <MultipleSelectChip label="Tags to Delete" items={allUserTags} onSelectChange={handleDeleteSelectChange} disabled={props.disabled} />
                        </td>
                        <td>
                            <Button onClick={handleDelete} variant="contained" color="secondary" size="small">Delete selected</Button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <TextField label="New tag name" value={newTagTitle} onChange={(newValue) => setNewTagTitle(newValue.target.value)} size="small" focused />
                        </td>
                        <td>
                            <Button onClick={handleCreate} variant="contained" color="primary" size="small">Create New</Button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <AlertConfirmDialog
                open={deleteConfirmDialogOpen}
                title="Delete tags?"
                text="This will delete all selected tags from all your projects and events."
                setOpen={handleDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
            ></AlertConfirmDialog>
        </>
    )
}