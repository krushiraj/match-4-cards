import React from 'react';

export default class CreateCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      err: '',
    };
  }

  render() {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center mr-4 mb-4">
          {this.state.err && (
            <div class="text-center py-4 lg:px-4 my-2">
              <div
                class="p-2 bg-red-800 items-center text-red-100 leading-none lg:rounded-full flex lg:inline-flex"
                role="alert"
              >
                <span class="flex rounded-full bg-red-500 uppercase px-2 py-1 text-xs font-bold mr-3">
                  Error
                </span>
                <span class="font-semibold mr-2 text-left flex-auto">
                  {this.state.err}
                </span>
                <svg
                  class="fill-current opacity-75 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
                </svg>
              </div>
            </div>
          )}

          <input
            className="mx-auto shadow appearance-none border rounded w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="cardname"
            type="text"
            placeholder="Card Name"
            value={this.props.card}
            onChange={(e) => this.props.setCardName(e.target.value)}
          />

          <button
            className="flex align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 py-1 px-4 mx-auto my-2 rounded"
            onClick={() => {
              if (this.props.card) {
                this.props.createCard();
              } else this.setState({ err: 'Card name cannot be empty!' });
            }}
          >
            Create Card
          </button>
        </div>
      </div>
    );
  }
}
