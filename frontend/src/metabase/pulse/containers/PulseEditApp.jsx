/* eslint "react/prop-types": "warn" */
import { Component } from "react";
import { connect } from "react-redux";
import _ from "underscore";

import { push, goBack } from "react-router-redux";
import title from "metabase/hoc/Title";

import Collections from "metabase/entities/collections";
import Pulses from "metabase/entities/pulses";
import User from "metabase/entities/users";

import { getUser } from "metabase/selectors/user";
import {
  getPulseId,
  getEditingPulse,
  getPulseCardPreviews,
  getPulseFormInput,
} from "../selectors";
import PulseEdit from "../components/PulseEdit";

import {
  setEditingPulse,
  updateEditingPulse,
  saveEditingPulse,
  fetchPulseFormInput,
  fetchPulseCardPreview,
  testPulse,
} from "../actions";

const mapStateToProps = (state, props) => ({
  pulseId: getPulseId(state, props),
  pulse: getEditingPulse(state, props),
  cardPreviews: getPulseCardPreviews(state, props),
  formInput: getPulseFormInput(state, props),
  user: getUser(state),
  initialCollectionId: Collections.selectors.getInitialCollectionId(
    state,
    props,
  ),
});

const mapDispatchToProps = {
  setEditingPulse,
  updateEditingPulse,
  saveEditingPulse,
  fetchPulseFormInput,
  fetchPulseCardPreview,
  setPulseArchived: Pulses.actions.setArchived,
  testPulse,
  onChangeLocation: push,
  goBack,
};

class PulseEditApp extends Component {
  render() {
    return <PulseEdit {...this.props} />;
  }
}

export default _.compose(
  User.loadList(),
  connect(mapStateToProps, mapDispatchToProps),
  title(({ pulse }) => pulse && pulse.name),
)(PulseEditApp);
