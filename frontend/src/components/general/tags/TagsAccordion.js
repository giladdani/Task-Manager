import { useState, useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { ThreeDots } from 'react-loader-spinner';
import { TagItem } from './TagItem'
const TagsAPI = require('../../../apis/TagsAPI');

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

export const TagsAccordion = (props) => {
  const [expanded, setExpanded] = useState('');
  const [allTags, setAllTags] = useState();
  const componentMounted = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAndSetTags();
    }

    fetchData();

    return () => {
      componentMounted.current = false;
    }
  }, []);

  const fetchAndSetTags = async () => {
    TagsAPI.fetchTagsData()
    .then(data => {
      if (componentMounted.current) {
        setAllTags(data);
      } else {
        console.log(`[TagsAccordion - fetchAndSetTags] component is unmounted, not setting Tags!`)
      }
    })
    .catch(err => {
      console.log(err);
    })
  }

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <>
      {!allTags &&
        <ThreeDots color="#00BFFF" height={80} width={80} />
      }
      {
        allTags && allTags.length === 0 &&
        <p>You have no Tags</p>
      }
      {allTags &&
        allTags.map((tag, index) => {
          return (
            <Accordion expanded={expanded === tag.title} onChange={handleChange(tag.title)} key={index}>
              <AccordionSummary>
                <div><b>{tag.title}</b></div>
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  <TagItem
                    tag={tag}
                  ></TagItem>
                </div>
              </AccordionDetails>
            </Accordion>
          )
        })
      }
    </>
  );
}