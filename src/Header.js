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
            <button
              className="right-0 align-middle text-right bg-white-800 hover:bg-white-700 text-black font-bold border-2 py-2 px-4 ml-auto rounded"
              onClick={() => this.props.signOut()}
            >
              Sign Out
            </button>
          </span>
        )}
      </div>
    );
  }
}
