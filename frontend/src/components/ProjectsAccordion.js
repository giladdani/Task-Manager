import { useState, useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { Project } from './Project';
const ProjectsAPI = require('../apis/ProjectsAPI.js')


const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`, '&:not(:last-child)': { borderBottom: 0 }, '&:before': { display: 'none' },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon />}
    {...props}
  />
))(({ theme }) => ({
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper': {
    marginLeft: theme.spacing(2)
  },
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)'
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(2)
  }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)'
}));

export const ProjectsAccordion = (props) => {
  const [expanded, setExpanded] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const componentMounted = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAndSetProjects();
    }

    fetchData();

    return () => {
      componentMounted.current = false;
    }
  }, []);

  const fetchAndSetProjects = async () => {
    const [projects, error] = await ProjectsAPI.fetchProjects();

    if (componentMounted.current) {
      setAllProjects(projects);
    } else {
      console.log(`[ProjectsAccordion - fetchAndSetProjects] component is unmounted, not setting projects!`)
    }
  }

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const projectsList = allProjects.map((project, index) => {
    return (
      <Accordion expanded={expanded === project.title} onChange={handleChange(project.title)} key={index}>
        <AccordionSummary>
          <div><b>{project.title}</b></div>
        </AccordionSummary>
        <AccordionDetails>
          <div>
            <Project
              project={project}
              deleteProject={props.deleteProject}
              exportProject={props.exportProject}
            ></Project>
          </div>
        </AccordionDetails>
      </Accordion>
    )
  })

  return (
    <>
      {projectsList}
    </>
  );
}