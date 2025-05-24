import React from 'react';
import './about3.css';

const TeamSection = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Vignesh',
      title: 'Model',
      bio: 'Student at Kmit'
    },
    {
      id: 2,
      name: 'Prahas',
      title: 'Frontend Developer',
      bio: 'Student at Kmit'
    },
    {
      id: 3,
      name: 'Kowshik',
      title: 'Backend Developer',
      bio: 'Student at Kmit'
    },
    {
      id:4,
      name:'Raghu Vamshi',
      title:' AI Engineer,Creative head',
      bio:'Student at Kmit'
    }
  ];

  return (
    <section className="team-section">
      <h2>Meet Our Team</h2>
      <p className="team-intro">
        Our success is driven by our talented team of professionals who bring diverse
        skills and perspectives to every project.
      </p>
      <div className="team-grid">
        {teamMembers.map(member => (
          <div className="team-member" key={member.id}>
            <div className="member-photo"></div>
            <h3>{member.name}</h3>
            <p className="member-title">{member.title}</p>
            <p className="member-bio">{member.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
