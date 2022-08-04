import { useState } from 'react'
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { Project } from './Project';

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export const ProjectsAccordion = (props) => {
  const [expanded, setExpanded] = useState('panel1');

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const projectsList = props.projects.map((project, index) => {
    const allEvents = props.allEvents.events;
    const projectEvents = allEvents.filter(event => event.extendedProps.projectId == project.id)
    return(
        <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')} key={index}>
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
            <div>{project.title}</div>
        </AccordionSummary>
        <AccordionDetails>
            <div>
                <Project project={project} projectEvents={projectEvents} deleteProject={props.deleteProject} exportProject={props.exportProject}></Project>
            </div>
        </AccordionDetails>
        </Accordion>
    )})
    
  return (
    <>
        {projectsList}
    </>
  );
}