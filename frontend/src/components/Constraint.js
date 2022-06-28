import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const Constraint = (props) => {
    const startDate = new Date();
    // startDate.setHours(props.constraint.forbiddenTimeWindows[0].startTime.hour);
    // startDate.setMinutes(props.constraint.forbiddenTimeWindows[0].startTime.minute);
    const endDate = new Date();
    // endDate.setHours(props.constraint.forbiddenTimeWindows[0].endTime.hour);
    // endDate.setMinutes(props.constraint.forbiddenTimeWindows[0].endTime.minute);
    
    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td><label>Name:</label></td>
                        <td><input type="text"></input></td>
                    </tr>
                    <tr>
                        <td><label>Day:</label></td>
                        <td>{props.constraint.day}</td>
                    </tr>
                    <tr>
                        <td><label>Start time:</label></td>
                        <td className="whiteFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={startDate}  // TODO: show all times?
                                    onChange={(newValue) => {  }}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                    <tr>
                        <td><label>End time:</label></td>
                        <td className="whiteFont">
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    value={endDate}
                                    onChange={(newValue) => {  }}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}