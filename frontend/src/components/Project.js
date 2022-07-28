import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const Project = (props) => {

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td>{props.project.title}</td>
                    </tr>
                    <tr>
                        <td><label>Time Estimate:</label></td>
                        <td>{props.project.timeEstimate}</td>
                    </tr>
                    <tr>
                        <td><label>Start time:</label></td>
                        <td>
                            {props.project.start}
                            {/* <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={startDate}  // TODO: show all times?
                                    onChange={(newValue) => {  }}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider> */}
                        </td>
                    </tr>
                    <tr>
                        <td><label>End time:</label></td>
                        <td>
                            {props.project.end}
                            {/* <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={endDate}
                                    onChange={(newValue) => {  }}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider> */}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}