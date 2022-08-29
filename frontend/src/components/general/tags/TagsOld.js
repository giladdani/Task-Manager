import React, { useState, useEffect } from 'react';
import Select from '@mui/material/Select';
import Button from "@material-ui/core/Button";
import TagDialog from './TagDialog.js';
import TagsAPI from '../../../apis/TagsAPI.js';


/**
 * 
 * @param {*} props
 * * selectedTagIds
 * * onTagsUpdate
 * * setNotificationMsg
 */
export const Tags = (props) => {
    const [allUserTags, setAllUserTags] = useState([]);
    const [isTagDialogOpen, setTagDialogOpen] = useState(false);
    const [selectedTagsData, setSelectedTagsData] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState(props.selectedTagIds);
    // const [selectedTagIds, setSelectedTagIds] = useState([]);

    const [disabled, setDisabled] = useState(props.disabled);

    useEffect(() => {
        const fetchData = async () => {
            await fetchAndSetAllTags();
            findAndSetSelectedTags();
        }

        fetchData();
    }, [])

    useEffect(() => {
        findAndSetSelectedTags();
    }, [selectedTagIds])

    const fetchAndSetAllTags = async () => {
        return TagsAPI.fetchTagsData()
            .then(data => {
                setAllUserTags(data);
            })
            .catch(err => {
                console.error(err);
            })
    }

    const fetchAndUpdateTags = async () => {
        if (!selectedTagIds) {
            return null;
        }

        TagsAPI.getTagsDataByIds(selectedTagIds)
            .then(data => {
                setSelectedTagsData(data);
            })
            .catch(err => {
                console.error(err);
            })
    }

    const findAndSetSelectedTags = () => {
        let selectedTags = [];

        if (selectedTagIds) {
            for (const selectedId of selectedTagIds) {
                let tag = allUserTags.find(tag => tag.id === selectedId);
                if (tag) selectedTags.push(tag);
            }
        }

        setSelectedTagsData(selectedTags);
    }

    const handleTagsClose = () => {
        setTagDialogOpen(false);
    }

    const handleTagsUpdated = (selectedTagIds) => {
        setSelectedTagIds(selectedTagIds);
        if (props.onTagsUpdate) props.onTagsUpdate(selectedTagIds);
    }

    return (
        <>
            <label>Tags:</label>
            <Select
                multiple
                native
                inputProps={{
                    id: 'select-multiple-native',
                }}>
                {selectedTagsData && selectedTagsData.map((tag) => (
                    <option key={tag.id} value={tag.title}>
                        {tag.title}
                    </option>
                ))}
            </Select>
            <Button
                variant='contained'
                onClick={() => setTagDialogOpen(true)}
                disabled={disabled}
                size="small"
            >
                Edit Tags
            </Button>

            <TagDialog
                setNotificationMsg={props.setNotificationMsg}
                isOpen={isTagDialogOpen}
                onClose={handleTagsClose}
                // selectedTags={tags}
                selectedTagIds={selectedTagIds}
                onTagsUpdate={handleTagsUpdated}
            ></TagDialog>
        </>
    )
}