// Intentionally simple fixture for React framework detection
// This file demonstrates React component patterns for testing

const UserProfile = () => {
  return {
    type: 'div',
    props: {
      className: 'user-profile',
      children: [
        { type: 'h1', props: { children: 'User Profile' } }
      ]
    }
  };
};

module.exports = { UserProfile };
