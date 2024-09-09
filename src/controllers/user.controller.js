import { asynchandler } from "../utils/async_handlers.js";

const registerUser = asynchandler(async (req, res) => {
  res.status(200).json({
    message: "Response Ok",
  });
});

export { registerUser };
