import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

// Toggle style of selected items

function getStyles(item, title, theme) {
  return {
    fontWeight:
      title.indexOf(item) === -1 ? "normal" : "bold",
    backgroundColor:
      title.indexOf(item) === -1 ? "transparent" : "#cfcfcf"
  };
}

export default function MultipleSelectChip(props) {
  const theme = useTheme();
  const notInitialRender = useRef(false)

  // const [selectedItems, setSelectedItems] = useState((props.selectedItems) => props.selectedItems ? props.selectedItems : []);
  const [selectedItems, setSelectedItems] = useState(() => props.selectedItems ? props.selectedItems : []);

  useEffect(() => {
    if (props.selectedItems) {
      setSelectedItems(props.selectedItems);
    }
  }, [props.selectedItems])

  useEffect(() => {
    if (notInitialRender.current) {
      props.onSelectChange(selectedItems);
    } else {
      notInitialRender.current = true
    }
  }, [selectedItems]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedItems(typeof value === 'string' ? value.split(',') : value,);
  };

  return (
    <>
      <FormControl sx={{ m: 1, width: 300 }}>
        <Select
          labelId="demo-multiple-chip-label"
          id="demo-multiple-chip"
          multiple
          disabled={props.disabled}
          value={selectedItems}
          onChange={handleChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value.title}
                  label={value.title}
                  // color={value.color} // TODO: this doesn't work! Uncomment and we get a crash. Figure out how to add color.
                />
              ))}
            </Box>
          )}
        >
          {props.items && props.items.map((item) => (
            <MenuItem
              key={item.title}
              value={item}
              style={getStyles(item, selectedItems, theme)}>
              <Checkbox checked={selectedItems.indexOf(item) > -1} />
              <ListItemText primary={item.title} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}

// import * as React from 'react';
// import OutlinedInput from '@mui/material/OutlinedInput';
// import InputLabel from '@mui/material/InputLabel';
// import MenuItem from '@mui/material/MenuItem';
// import FormControl from '@mui/material/FormControl';
// import Select from '@mui/material/Select';

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;
// const MenuProps = {
//   PaperProps: {
//     style: {
//       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
//       width: 250,
//     },
//   },
// };

// export default function MultipleSelectCheckmarks(props) {
//   const [personName, setPersonName] = React.useState([]);

//   const handleChange = (event) => {
//     const {
//       target: { value },
//     } = event;
//     setPersonName(
//       // On autofill we get a stringified value.
//       typeof value === 'string' ? value.split(',') : value,
//     );
//   };

//   return (
//     <div>
//       <FormControl sx={{ m: 1, width: 300 }}>
//         <InputLabel id="demo-multiple-checkbox-label">Tag</InputLabel>
//         <Select
//           labelId="demo-multiple-checkbox-label"
//           id="demo-multiple-checkbox"
//           multiple
//           value={personName}
//           onChange={handleChange}
//           input={<OutlinedInput label="Tag" />}
//           renderValue={(selected) => selected.join(', ')}
//           MenuProps={MenuProps}
//         >
//           {props.items.map((item) => (
//             <MenuItem key={item.title} value={item}>
//               <Checkbox checked={personName.indexOf(item) > -1} />
//               <ListItemText primary={item.title} />
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//     </div>
//   );
// }