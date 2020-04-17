import React from 'react';

export default class Header extends React.Component {
  safeBool(val) {
    if (val === true || val === 'true') return true;
    return false;
  }

  render() {
    return (
      <div className="top-0 hieght-auto w-screen bg-gray-400">
        {this.props.user && (
          <span className="flex flex-row">
            <h2 className="inline my-auto">
              <span className="font-bold  ml-2">
                {this.props.user.displayName}
              </span>
              <span>
                {' '}
                ({this.props.roomId || 'No room joined'}
                {this.safeBool(this.props.isAdmin) ? ' - Admin' : ''})
              </span>
            </h2>
            {this.props.roomId && (
              <button className="px-2" onClick={() => this.props.leaveRoom()}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            )}
            <button
              className="flex right-0 align-middle text-right bg-white-800 hover:bg-white-700 text-black font-bold border-2 py-2 px-4 ml-auto rounded"
              onClick={() => this.props.signOut()}
            >
              <span className="mr-2">Sign out</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </button>
          </span>
        )}
      </div>
    );
  }
}
