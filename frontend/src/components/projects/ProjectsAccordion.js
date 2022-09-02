import { useState, useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles';
import { ThreeDots } from 'react-loader-spinner'
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { Project } from './Project';
import { isValidStatus } from '../../apis/APIUtils';
const ProjectsAPI = require('../../apis/ProjectsAPI.js')


const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid white`, '&:not(:last-child)': { borderBottom: 0 }, '&:before': { display: 'none' },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon />}{...props} />))(({ theme }) => ({
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper': {
      marginLeft: theme.spacing(2),
      color: "white"
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
  borderTop: '1px solid white'
}));

export const ProjectsAccordion = (props) => {
  const [expanded, setExpanded] = useState('');
  const [allProjects, setAllProjects] = useState();
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
    ProjectsAPI.fetchProjectsData()
      .then(data => {
        if (componentMounted.current) {
          setAllProjects(data);
        } else {
          console.log(`[ProjectsAccordion - fetchAndSetProjects] component is unmounted, not setting projects!`)
        }
      })
      .catch(err => {
        console.error(err);
      })
  }

  const deleteProject = async (project) => {
    ProjectsAPI.deleteProject(project)
      .then(response => {
        if (isValidStatus(response, ProjectsAPI.deleteProjectValidStatusArr)) {
          fetchAndSetProjects();
          props.setNotificationMsg("Project deleted");
        } else {
          props.setNotificationMsg("Failed to delete");
        }
      })
      .catch(err => {
        console.error(err);
        props.setNotificationMsg("Failed to delete");
      })
  }

  const exportProject = async (project) => {

    ProjectsAPI.exportProject(project)
      .then(response => {
        if (isValidStatus(response, ProjectsAPI.exportProjectValidStatusArr)) {
          fetchAndSetProjects();
          props.setNotificationMsg("Project exported to Google");
        } else {
          props.setNotificationMsg("Failed to export");
        }
      })
      .catch(err => {
        console.error(err);
        props.setNotificationMsg("Failed to export");
      })
  }

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <>
      {!allProjects &&
        <ThreeDots color="#00BFFF" height={80} width={80} />
      }
      {
        allProjects && allProjects.length === 0 &&
        <p>You have no projects</p>
      }
      {allProjects &&
        allProjects.map((project, index) => {
          return (
            <Accordion expanded={expanded === project.title} onChange={handleChange(project.title)} key={index}>
              <AccordionSummary>
                <div><b>{project.title}</b></div>
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  <Project
                    project={project}
                    deleteProject={deleteProject}
                    exportProject={exportProject}
                    setNotificationMsg={props.setNotificationMsg}
                  ></Project>
                </div>
              </AccordionDetails>
            </Accordion>
          )
        })
      }
    </>
  );
}