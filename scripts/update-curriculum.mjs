import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── PRACTICE SECTIONS (item 5) ───────────────────────────────────────────────
const PRACTICE = {
  'why-python-for-robotics': `
## Practice

**Hands-on task:** Write a Python script that simulates a distance sensor publishing readings at 10 Hz using a loop and \`time.sleep()\`. Add a function that triggers a "stop" event when a reading drops below 0.3 m and prints how many ticks elapsed before the event fired.

**Reflection question:** Python's GIL prevents true parallel thread execution. Why does this matter for a robot that needs to read sensors and drive motors simultaneously, and how does ROS 2 work around it?

**Going further:** The [rclpy API reference](https://docs.ros2.org/latest/api/rclpy/) shows every Python primitive ROS 2 exposes — skim the \`Node\`, \`Publisher\`, and \`Subscription\` classes to see how they map to what you'll write next.`,

  'variables-loops-functions': `
## Practice

**Hands-on task:** Write a function \`check_joint_limits(angles: list[float], limits: list[tuple]) -> list[str]\` that returns the names of any joints exceeding their limits. Test it with a loop that generates 100 random angle sets for a 6-DOF arm.

**Reflection question:** What happens to your robot's control loop if a function raises an unhandled exception? How should you structure error handling differently for a safety-critical loop vs a logging function?

**Going further:** [Real Python's guide to Python functions](https://realpython.com/defining-your-own-python-function/) covers closures and default arguments — both appear frequently in ROS 2 callback patterns.`,

  'lists-and-dictionaries': `
## Practice

**Hands-on task:** Create a dictionary representing a 4-joint robot where each joint has keys \`name\`, \`current_angle\`, \`min_limit\`, \`max_limit\`. Write a function that returns a list of joints currently out of bounds and another that normalises all angles to the range [−π, π].

**Reflection question:** When would you use a list of dictionaries vs a dictionary of lists to store a time-series of joint states? What are the access-pattern tradeoffs?

**Going further:** [Python's official data structures documentation](https://docs.python.org/3/tutorial/datastructures.html) — pay particular attention to list comprehensions, which appear constantly in ROS 2 message processing code.`,

  'what-is-ros2': `
## Practice

**Hands-on task:** Launch the Turtlebot3 demo (\`ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py\`) and use \`ros2 node list\`, \`ros2 topic list\`, and \`ros2 topic echo /scan\` to map out the running system. Draw the node graph by hand, then compare it to what \`rqt_graph\` shows.

**Reflection question:** What is the difference between a ROS 2 topic and a service? Give a concrete robot example where you would choose each.

**Going further:** The [ROS 2 Concepts documentation](https://docs.ros.org/en/humble/Concepts.html) explains DDS, Quality of Service, and the lifecycle node — all concepts that will matter once you move beyond simple pub/sub.`,

  'first-ros2-node': `
## Practice

**Hands-on task:** Extend your publisher node to include a timestamp alongside the sensor reading in a \`Float32MultiArray\` message. Write a subscriber that prints a warning if two consecutive readings differ by more than 0.5 m, suggesting a sensor glitch.

**Reflection question:** What happens to your subscriber node if the publisher crashes — does ROS 2 notify it, buffer messages, or simply stop delivering them? Check the QoS reliability documentation for the answer.

**Going further:** [Articulated Robotics on YouTube](https://www.youtube.com/@ArticulatedRobotics) has the clearest visual explanations of ROS 2 node communication patterns available — start with the "ROS2 for Beginners" playlist.`,

  'launch-files-parameters': `
## Practice

**Hands-on task:** Write a launch file that starts a sensor publisher and a data logger node, passing the publish frequency as a launch argument with a default of 10 Hz. Override it from the command line to 25 Hz and verify both nodes pick up the new value using \`ros2 param get\`.

**Reflection question:** How do ROS 2 parameters differ from environment variables as a configuration mechanism? Which would you use for something that changes between robot deployments vs something that changes at runtime?

**Going further:** The [ROS 2 Launch System documentation](https://docs.ros.org/en/humble/Tutorials/Intermediate/Launch/Launch-Main.html) covers substitutions, conditions, and event handlers — features that make launch files significantly more powerful than simple node runners.`,

  'ros2-workspaces-and-colcon': `
## Practice

**Hands-on task:** Create a workspace at \`~/robolearn_ws\`, then create two packages inside \`src/\` — \`sensor_reader\` and \`data_processor\`. Add \`sensor_reader\` as a \`<depend>\` of \`data_processor\` in its \`package.xml\`. Build with \`colcon build\` and confirm both packages appear in \`ros2 pkg list | grep -E "sensor_reader|data_processor"\`.

**Reflection question:** Why does ROS 2 separate \`build/\` and \`install/\` directories rather than building in-place like a typical Python project? What problem does this solve when you have 20 interdependent packages?

**Going further:** Browse the [Nav2 repository on GitHub](https://github.com/ros-navigation/navigation2) and note how they organise packages across the monorepo — you'll recognise the exact layout described in this lesson. The [colcon docs](https://colcon.readthedocs.io/en/released/) cover \`--executor parallel\` for faster builds.`,

  'intro-gazebo-rviz': `
## Practice

**Hands-on task:** Launch the Turtlebot3 Gazebo world and add a LaserScan display in RViz pointed at the \`/scan\` topic. Place a box obstacle in Gazebo using the Insert panel, then use \`ros2 topic echo /scan\` to confirm the new obstacle appears as a shorter range reading in the data.

**Reflection question:** What is the fundamental difference between Gazebo and RViz? Can you use RViz without Gazebo running? Give a real scenario where you would.

**Going further:** The [Gazebo ROS 2 integration tutorials](https://gazebosim.org/docs/latest/ros_gz_tutorials/) cover spawning custom robot models, bridging topics, and using the newer Gazebo Harmonic with ROS 2.`,

  'understanding-urdf': `
## Practice

**Hands-on task:** Write a URDF for a 2-link arm — two rectangular links connected by a revolute joint with limits of ±90°. Load it in RViz using \`robot_state_publisher\` and move the joint using \`joint_state_publisher_gui\`. Verify the visual and collision geometry match.

**Reflection question:** What information does URDF NOT capture that MoveIt 2's SRDF adds? Give two specific examples from a real robot arm.

**Going further:** The [URDF tutorials in the ROS 2 docs](https://docs.ros.org/en/humble/Tutorials/Intermediate/URDF/URDF-Main.html) walk through xacro macros — the templating system that makes large URDF files manageable.`,

  'motion-planning-moveit2': `
## Practice

**Hands-on task:** Launch the Panda MoveIt 2 demo. Write a Python node using MoveItPy that moves the arm to the \`ready\` named state, adds a box collision object 0.3 m in front of the end-effector, then attempts to plan to \`extended\`. Observe whether MoveIt 2 replans around the box or reports failure.

**Reflection question:** MoveIt 2 uses sampling-based planners (OMPL) by default rather than analytical IK. What is the tradeoff — when would an analytical IK solver be preferable?

**Going further:** The [MoveIt 2 tutorials](https://moveit.picknik.ai/main/index.html) maintained by PickNik are the authoritative reference. The [Universal Robots ROS 2 driver](https://github.com/UniversalRobots/Universal_Robots_ROS2_Driver) shows how MoveIt 2 connects to real hardware.`,

  'forces-torque-load': `
## Practice

**Hands-on task:** Calculate the torque required at the base joint of a 40 cm arm holding a 500 g payload at full extension. Then double the arm length and recalculate. What motor stall torque (with 2× safety factor) would you specify?

**Reflection question:** Why does torque matter more than raw force when selecting a motor for a robot joint? What happens if you select a motor with sufficient force but insufficient torque?

**Going further:** [MIT OpenCourseWare 2.003](https://ocw.mit.edu/courses/2-003-modeling-dynamics-and-control-i-spring-2005/) covers the mechanics behind robot loading in depth — the lecture notes are free and thorough.`,

  'joints-degrees-of-freedom': `
## Practice

**Hands-on task:** Sketch a robot manipulator with exactly 4 DOF that can reach any point in a vertical plane. Label each joint type. Then identify which additional DOF you'd need to reach points at arbitrary orientations in 3D space.

**Reflection question:** A 6-DOF arm is called "kinematically redundant" for a task with 5 constraints. What does this mean and how can a controller exploit that redundancy?

**Going further:** [Siciliano's Robotics: Modelling, Planning and Control](https://www.springer.com/gp/book/9781846286414) — the first three chapters on kinematics are the standard reference. Many university libraries provide free access.`,

  'material-selection': `
## Practice

**Hands-on task:** For a 30 cm robot arm link that must support 1 kg at its tip and weigh as little as possible, compare aluminium 6061-T6, PLA (FDM printed), and carbon fibre tube using specific stiffness (Young's modulus ÷ density). Rank them and explain when the lowest-ranked material would still be the right choice.

**Reflection question:** When would you deliberately choose a weaker, more flexible material for a robot component? Give a real example where compliance is a design goal.

**Going further:** [Engineers Edge materials database](https://www.engineersedge.com/materials.htm) has mechanical properties for every common engineering material — bookmark it for every future design decision.`,

  'intro-to-fusion360': `
## Practice

**Hands-on task:** Model an L-bracket in Fusion 360 (or FreeCAD) with a 50 mm × 50 mm footprint, 3 mm wall thickness, and two M3 holes on each face. Export as STL and import it into Meshmixer to verify the mesh is watertight.

**Reflection question:** What is the difference between parametric and direct modelling, and why does parametric modelling matter for robot parts that you'll iterate on multiple times?

**Going further:** [Lars Christensen's Fusion 360 YouTube channel](https://www.youtube.com/c/cadCAMstuff) has the most practical beginner-to-intermediate tutorials available — his "Master Class" series covers every tool used in robot part design.`,

  'modeling-a-robot-link': `
## Practice

**Hands-on task:** Model a robot link 120 mm long with a 12 mm bore on each end and a triangular lightening cutout in the middle. Export as STL and check it is watertight. Calculate the approximate material volume and estimate the weight if printed in PLA (density ≈ 1.24 g/cm³).

**Reflection question:** How do you decide on minimum wall thickness for an FDM-printed structural part vs an aluminium-machined part? What are the different constraints driving each decision?

**Going further:** [Prusa's Design Guidelines for FDM](https://help.prusa3d.com/article/design-guidelines-for-fdm_128583) explains overhang limits, hole tolerances, and layer orientation — all directly applicable to robot part design.`,

  'assemblies-and-constraints': `
## Practice

**Hands-on task:** In Fusion 360, assemble the L-bracket and robot link from previous lessons using a revolute joint constraint with ±90° limits. Animate the joint through its full range and check for collisions. Export the assembly as STEP and re-import it to verify fidelity.

**Reflection question:** What is the difference between a rigid joint and a revolute joint in an assembly, and when would you use a rigid joint for something that actually moves in the real robot?

**Going further:** Browse [GrabCAD Community](https://grabcad.com/library) — search "robot arm" and study how professional assemblies handle joint constraints, bearing fits, and fastener patterns.`,

  'gears-belts-screws': `
## Practice

**Hands-on task:** Design a two-stage gear train that reduces 3000 RPM to 60 RPM (50:1 total). Calculate the torque at each stage assuming 95% efficiency per stage. Then calculate the output torque if input torque is 0.1 Nm.

**Reflection question:** Why does gear backlash matter far more for a robot arm than for a conveyor belt? What happens to position accuracy when backlash is present in a closed-loop joint?

**Going further:** The [Engineering Toolbox gear calculations page](https://www.engineeringtoolbox.com/gear-ratios-d_1227.html) has every formula you need for gear train design, including efficiency, torque, and speed calculations.`,

  'servo-stepper-dc-motors': `
## Practice

**Hands-on task:** For three robot joints — (1) a fast-spinning wheel, (2) a precise positioning arm joint, (3) a slow heavy-lifting joint — select the most appropriate motor type and write two specific technical justifications for each choice.

**Reflection question:** Why do industrial robot arms use servo motors with encoders rather than stepper motors, even though steppers are cheaper and simpler? Under what conditions do steppers lose steps?

**Going further:** [Great Scott!'s motor and driver video series on YouTube](https://www.youtube.com/@GreatScottLab) gives practical wiring and code examples for every motor type covered in this lesson.`,

  'designing-a-gripper': `
## Practice

**Hands-on task:** Sketch and dimension a parallel gripper that can grasp a 30 mm diameter cylinder with at least 10 N of grip force. Specify the actuator type, finger geometry, and contact material. Calculate the servo torque required given the finger moment arm.

**Reflection question:** What is the difference between a precision grasp and a power grasp? Give a robot task example where the wrong grasp type would cause the object to be dropped.

**Going further:** The [OpenGripper project on GitHub](https://github.com/OpenGripper/OpenGripper) provides open-source gripper designs with full CAD files — study how they handle the linkage geometry for parallel motion.`,

  'voltage-current-resistance': `
## Practice

**Hands-on task:** A 12V DC motor draws 2 A at stall. Calculate power dissipated, select an appropriate fuse (with 20% margin), and determine minimum wire gauge for a 1 m run using an AWG ampacity chart. Verify your answer against the chart at 12V.

**Reflection question:** Why does a motor draw significantly more current when stalled than when spinning freely? What does this mean for your fuse and wiring choices during robot startup?

**Going further:** [Adafruit's DC Motor selection guide](https://learn.adafruit.com/adafruit-motor-selection-guide) bridges the theory from this lesson to practical component selection decisions.`,

  'reading-schematics': `
## Practice

**Hands-on task:** Download the L298N datasheet and trace the full current path from the power supply pin to Motor A output. Identify every component in that path, its function, and its rating. Then draw the equivalent circuit from memory.

**Reflection question:** What does a dashed boundary box around a group of components in a schematic typically indicate? How does this map to a physical PCB or module?

**Going further:** [All About Circuits textbook — Chapter 9 on schematics](https://www.allaboutcircuits.com/textbook/reference/chpt-9/schematic-diagram/) is a free, comprehensive reference for every symbol and convention you'll encounter in robotics datasheets.`,

  'power-systems': `
## Practice

**Hands-on task:** Build a power budget for a robot with 2× DC motors (12V, 1A each at load), 1× Raspberry Pi (5V, 2.5A), and 1× LIDAR (5V, 0.5A). Select a LiPo pack that provides at least 45 minutes of runtime. Show all calculations including conversion losses.

**Reflection question:** Why do roboticists typically use separate power rails for motors and logic circuits? What failure mode does this prevent?

**Going further:** [SparkFun's Power Management tutorial](https://learn.sparkfun.com/tutorials/voltage-dividers/all) covers voltage dividers, regulators, and buck converters — the three most common power conditioning circuits in robot builds.`,

  'arduino-vs-pi-vs-esp32': `
## Practice

**Hands-on task:** For a robot that needs to read 4 encoder signals at 1 kHz, run a ROS 2 navigation stack, and transmit telemetry over WiFi — map each task to the appropriate platform (Arduino Nano / ESP32 / Raspberry Pi 4) and justify the split with specific hardware constraints.

**Reflection question:** What does "real-time" mean in robot motor control, and why does it matter which CPU runs the PID loop? What happens if a Linux process scheduler delays your control loop by 20 ms?

**Going further:** [Articulated Robotics on YouTube](https://www.youtube.com/@ArticulatedRobotics) has a complete series on building a ROS 2 robot with a Raspberry Pi — the most practical bridge between this lesson and real hardware.`,

  'gpio-pwm-serial': `
## Practice

**Hands-on task:** In [Wokwi](https://wokwi.com) (browser-based Arduino simulator), wire a potentiometer to an analog pin and map its value to a servo angle (0–180°) output as PWM. Add a \`Serial.println()\` that logs both values at 10 Hz. Verify the servo moves smoothly across the full range.

**Reflection question:** Why must you be careful about connecting a 5V Arduino GPIO directly to a 3.3V ESP32 or Raspberry Pi input? What specific damage can occur, and what component prevents it?

**Going further:** [Wokwi](https://wokwi.com) lets you simulate Arduino, ESP32, and Raspberry Pi Pico circuits in the browser — you can test every circuit from this lesson without any hardware.`,

  'flashing-firmware-debugging': `
## Practice

**Hands-on task:** Flash the Arduino Blink sketch, then modify it to blink the wrong pin. Use \`Serial.println()\` to add debug output that prints the pin state every 500 ms. Identify the bug from the serial output alone, without looking at the source code.

**Reflection question:** What is the difference between debugging with serial prints vs a hardware debugger (JTAG/SWD)? When does the overhead of setting up a hardware debugger become worth it?

**Going further:** The [Interrupt blog by Memfault](https://interrupt.memfault.com/blog/) covers professional embedded debugging techniques — the GDB and JTAG posts are directly applicable to any ARM-based robotics board.`,

  'imu-encoders-distance': `
## Practice

**Hands-on task:** Using simulated gyroscope data (a constant 45°/s Z-axis rotation), write code that integrates the reading over 4 seconds to estimate heading. Introduce ±2°/s random noise and observe how quickly the heading estimate drifts. How does this change your trust in a raw IMU?

**Reflection question:** Why does double-integrating accelerometer data to estimate position accumulate error so rapidly? What is this phenomenon called, and why is it worse at low speeds?

**Going further:** [Adafruit's IMU calibration guide](https://learn.adafruit.com/adafruit-sensorlab-gyroscope-calibration) explains hard-iron and soft-iron calibration — the mandatory step before any IMU reading is trustworthy.`,

  'motor-drivers-hbridges': `
## Practice

**Hands-on task:** In [Wokwi](https://wokwi.com), wire an L298N to an Arduino and write code that ramps a motor from 0 to full speed over 2 seconds using PWM, holds for 1 second, then decelerates back. Implement a brief stop between direction changes and explain in comments why it is necessary.

**Reflection question:** Why must you add a brief stop between direction changes rather than switching direction at full speed? What electrical phenomenon causes damage if you skip it?

**Going further:** [SparkFun's TB6612FNG hookup guide](https://learn.sparkfun.com/tutorials/tb6612fng-hookup-guide) covers the modern alternative to the L298N — lower heat, higher efficiency, and the driver used in most current robotics hobbyist hardware.`,

  'sensor-fusion-basics': `
## Practice

**Hands-on task:** Implement a complementary filter that fuses gyroscope and accelerometer data to estimate roll angle: \`angle = 0.98 × (angle + gyro_rate × dt) + 0.02 × accel_angle\`. Run it on 10 seconds of simulated data and compare the result to using each sensor independently.

**Reflection question:** Why does the \`robot_localization\` package in ROS 2 use an Extended Kalman Filter rather than a simpler complementary filter? What does the EKF handle that the complementary filter cannot?

**Going further:** [Roger Labbe's Kalman and Bayesian Filters in Python](https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python) is a free interactive Jupyter book — the most accessible introduction to the mathematics behind \`robot_localization\`.`,
}

// ─── OVERVIEW REWRITES (item 4) ────────────────────────────────────────────────
const OVERVIEWS = {
  'why-python-for-robotics': `You're debugging a sensor callback at 2am and the entire navigation stack depends on your understanding of one 15-line Python script. Python runs on every major robotics platform — ROS 2, the Raspberry Pi in your robot's compute module, the Jupyter notebook analysing last week's test data. Learning it in a robotics context from the start means every example you work through is directly applicable.`,

  'variables-loops-functions': `The joint states of a 6-DOF arm update 50 times per second — that's 300 float values per second flowing through your code. Structuring variables, loops, and functions correctly is the difference between a robot controller that responds in 20 ms and one that stutters under load. These fundamentals will appear in every ROS 2 node you write.`,

  'lists-and-dictionaries': `A LIDAR sensor returns 360 distance readings every scan cycle — stored in a list. Your robot's configuration — joint names, limits, home positions — lives in a dictionary. Get comfortable with both now because every ROS 2 message type maps directly onto these Python data structures.`,

  'what-is-ros2': `A mobile robot's camera node, navigation stack, and motor controller all need to exchange data 50 times per second without any of them blocking the others. ROS 2's publish-subscribe architecture was designed for exactly this problem. Understanding it is your entry point to every robotics framework that follows.`,

  'first-ros2-node': `Before any robot moves, someone wrote a node that reads a sensor. Your first node will do exactly that — publish a stream of distance readings that another node subscribes to, forming the simplest possible robot communication loop. Everything in ROS 2 builds from this pattern.`,

  'launch-files-parameters': `Launching a real robot means starting 12 nodes simultaneously with the right parameters for the current environment — indoor vs outdoor, simulation vs hardware, low-power vs full-performance mode. A launch file turns that into a single command. Understanding launch files is what separates "runs on my machine" from "runs reliably on the robot."`,

  'ros2-workspaces-and-colcon': `You've written a node and launched it — now imagine handing your project to a teammate. Without a proper workspace structure, they'd spend an hour figuring out where things live before writing a single line of code. Every production ROS 2 project follows the same colcon workspace pattern, and getting it right now means every simulation and navigation lesson from here on will make immediate sense.`,

  'intro-gazebo-rviz': `Your robot won't break, complain, or cost you a motor controller if you get the code wrong in simulation. Gazebo provides the physics; RViz provides the visibility into what the robot perceives and plans. Together they are your primary development environment for everything that follows before any hardware is involved.`,

  'understanding-urdf': `Before MoveIt 2 can plan a trajectory or Gazebo can simulate physics, both need to know exactly where every link is, how heavy it is, and what range of motion each joint allows. That description lives in a URDF file — and writing one by hand teaches you more about your robot's geometry than any CAD tool will.`,

  'motion-planning-moveit2': `Driving a mobile robot to a coordinate is straightforward. Moving a 6-DOF arm so that the end-effector reaches a target pose without hitting anything — while coordinating six joints simultaneously — is a different problem entirely. MoveIt 2 solves it: you describe where you want the hand to go and it handles the rest.`,

  'forces-torque-load': `A robot arm that lifts 2 kg in the lab fails the moment you bolt on a camera mount because nobody calculated the torque at the shoulder joint. Forces and torque are the first things to check when a robot breaks structurally — and the first things to design around when it doesn't.`,

  'joints-degrees-of-freedom': `A door hinge gives you 1 DOF. Your shoulder gives you 3. Understanding degrees of freedom tells you immediately how many actuators a robot needs and what poses it can and cannot reach — the foundation of every kinematic analysis you will do.`,

  'material-selection': `A drone arm built from solid aluminium works great until it weighs 400 g and drains the battery in 8 minutes. The carbon fibre version of the same part weighs 80 g and flies for 30 minutes. Material choice is often the single biggest engineering decision in a robot's design, yet it's frequently made by gut feeling rather than calculation.`,

  'intro-to-fusion360': `The gap between a robot that exists in your head and one you can manufacture is a CAD model. Fusion 360 is free for students and hobbyists, runs without installation, and exports directly to the URDF-compatible formats that Gazebo accepts — making it the fastest path from concept to simulation.`,

  'modeling-a-robot-link': `The robot link you model today might be 3D printed tomorrow and bolted to a real motor by next week. Designing with manufacturable constraints — wall thickness, hole clearances, fillet radii — from the start eliminates the cycle of print, fail, remodel, repeat that wastes most beginners' time.`,

  'assemblies-and-constraints': `A single arm link is not a robot. The moment you assemble two links with a joint constraint you can simulate motion, check clearances, and catch interference before anything is manufactured. Assembly modelling is where mechanical design becomes robotics.`,

  'gears-belts-screws': `You need 100 Nm of torque at a joint but your motor produces only 2 Nm at 3000 RPM. A 50:1 gear reduction solves it — at the cost of speed. Every robot drivetrain is a negotiation between torque, speed, backlash, and efficiency, and it starts with these three transmission types.`,

  'servo-stepper-dc-motors': `The wrong motor choice can make a perfectly designed robot useless — a stepper that loses steps under load, a servo that can't hold position against gravity, a brushed DC motor that burns out after 20 hours of operation. Matching motor type to application is one of the most consequential decisions in robot hardware design.`,

  'designing-a-gripper': `A gripper that works on a cylinder fails on a flat plate. A vacuum cup that handles dry cardboard drops a wet part. Gripper design is tightly constrained by the object, the environment, and the force budget — and getting it wrong means the rest of the robot is useless for its intended task.`,

  'voltage-current-resistance': `A robot's motor driver board just burned out mid-demo. Nine times out of ten the cause is a current calculation that was never done. Ohm's law and the power equation are the first checks before any wire is connected — the foundation that every electrical decision in this track builds on.`,

  'reading-schematics': `The L298N motor driver datasheet has a schematic on page 4 that tells you exactly how to wire it to your microcontroller and motor — if you can read it. Every sensor, driver, and power module ships with a schematic, and reading them correctly eliminates an entire category of wiring mistakes before they happen.`,

  'power-systems': `A robot that runs out of battery mid-mission, or brownouts its processor when the motors spin up, is a failed robot. Power system design — battery selection, voltage regulation, current budgeting — is unglamorous work, but it's what keeps every other subsystem running reliably.`,

  'arduino-vs-pi-vs-esp32': `A team spent three weeks trying to run a navigation stack on an Arduino Uno before realising it has 2 KB of RAM. Knowing which platform to reach for — microcontroller for real-time control, SBC for compute, wireless module for communication — is the first architectural decision in any robot build.`,

  'gpio-pwm-serial': `The servo isn't moving and you've been staring at the code for an hour. Nine times out of ten it's a PWM frequency mismatch or a voltage-level issue on the signal line. Understanding GPIO, PWM, and serial at the signal level means you can diagnose problems with a multimeter rather than guessing.`,

  'flashing-firmware-debugging': `The upload succeeded but the robot does nothing. The serial monitor shows garbage. The LED blinks twice instead of three times. Debugging embedded systems is a skill built on systematic elimination — and knowing your tools is the only way to work through it quickly.`,

  'imu-encoders-distance': `Your robot thinks it drove straight for 2 metres but it's actually 30 cm off course at a 15° angle. This is what happens when you trust a single sensor without understanding its failure mode. IMUs drift. Encoders slip. Distance sensors get confused by glass and transparent surfaces.`,

  'motor-drivers-hbridges': `Your motor spins in exactly one direction and you can't figure out why — until you notice the H-bridge enable pin is wired permanently HIGH. Motor drivers are simple circuits with sharp, predictable failure modes. Understanding the H-bridge internally means you can diagnose problems without a schematic in front of you.`,

  'sensor-fusion-basics': `Your IMU says the robot is moving east at 0.5 m/s. The wheel encoders say it's stationary. The camera says it's rotating slowly. Which one is right? Sensor fusion exists because no single sensor is reliable enough on its own — and in ROS 2, the \`robot_localization\` package and \`sensor_msgs\` types are how you combine them systematically.`,
}

// ─── SETUP CALLOUTS (item 6) ───────────────────────────────────────────────────
const SETUP_CALLOUT = `<Callout type="tip">
**Setup:** Ubuntu 22.04 LTS and ROS 2 Humble are required for this lesson. Follow the [official installation guide](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debs.html) if you haven't already, then run: \`sudo apt install ros-humble-desktop python3-colcon-common-extensions\` and add \`source /opt/ros/humble/setup.bash\` to your \`~/.bashrc\`.
</Callout>

`

const SETUP_CALLOUT_SLUGS = new Set([
  'what-is-ros2',
  'first-ros2-node',
  'launch-files-parameters',
  'intro-gazebo-rviz',
  'understanding-urdf',
])

// ─── NEW LESSONS (items 1 & 2) ────────────────────────────────────────────────
const NEW_LESSON_BRIDGE = {
  slug: 'ros2-workspaces-and-colcon',
  title: 'ROS 2 Workspaces and the Colcon Build System',
  description: 'Learn how to structure a real ROS 2 project using colcon workspaces and packages — the foundation every simulation and navigation project is built on.',
  difficulty: 'intermediate',
  estimated_minutes: 18,
  // module slug to look up
  _module_slug: 'ros2-essentials',
  sort_order: 4,
  content_mdx: `<Callout type="tip">
**Setup:** Ubuntu 22.04 LTS and ROS 2 Humble required. Ensure ROS 2 is installed via the [official debs guide](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debs.html), then install colcon: \`sudo apt install python3-colcon-common-extensions\`
</Callout>

## Why workspace structure matters

You've written a node and launched it — now imagine handing your project to a teammate. Without a proper workspace layout, they'll spend an hour figuring out where things live before writing a single line of code. Every production ROS 2 project follows the same colcon workspace pattern, and getting it right now means every simulation and navigation lesson from here on will make immediate sense.

## What is a colcon workspace?

A workspace is a directory that colcon recognises as the root of your project. After your first build it always has this shape:

\`\`\`
my_robot_ws/
├── src/        ← your packages live here (you create this)
├── build/      ← intermediate build files (colcon creates, don't edit)
├── install/    ← final compiled output — what you source
└── log/        ← build logs
\`\`\`

You only create \`src/\` by hand. Colcon generates everything else.

## Creating your first workspace

\`\`\`bash
mkdir -p ~/my_robot_ws/src
cd ~/my_robot_ws
colcon build
source install/setup.bash
\`\`\`

After sourcing \`install/setup.bash\`, ROS 2 knows about every package in your workspace. Add it to your shell so every new terminal picks it up automatically:

\`\`\`bash
echo "source ~/my_robot_ws/install/setup.bash" >> ~/.bashrc
\`\`\`

## What is a ROS 2 package?

A package is the smallest unit of organisation in ROS 2 — the smallest thing you can build, share, or install. Every package needs at minimum:

- \`package.xml\` — metadata: name, version, dependencies
- \`CMakeLists.txt\` (C++) or \`setup.py\` (Python)

Create a Python package:

\`\`\`bash
cd ~/my_robot_ws/src
ros2 pkg create my_robot --build-type ament_python --dependencies rclpy
\`\`\`

This generates:

\`\`\`
my_robot/
├── my_robot/
│   ├── __init__.py
│   └── my_node.py
├── resource/
├── test/
├── package.xml
└── setup.py
\`\`\`

## Declaring dependencies

Every ROS 2 package your code imports must appear in \`package.xml\`:

\`\`\`xml
<depend>rclpy</depend>
<depend>sensor_msgs</depend>
\`\`\`

This lets colcon resolve build order when multiple packages depend on each other. To install all declared dependencies in one shot:

\`\`\`bash
cd ~/my_robot_ws
rosdep install --from-paths src --ignore-src -r -y
\`\`\`

## Building efficiently

\`\`\`bash
# Build the full workspace
colcon build

# Build only one package (much faster during development)
colcon build --packages-select my_robot

# Symlink Python files so edits take effect without rebuilding
colcon build --symlink-install
\`\`\`

<Callout type="warning">
Always run \`colcon build\` from the workspace root (\`~/my_robot_ws\`), never from inside \`src/\`. Running it from the wrong directory creates nested \`build/\` folders that are painful to untangle.
</Callout>

## How real projects are laid out

Production robots split functionality across packages by concern:

\`\`\`
my_robot_ws/src/
├── my_robot_description/    ← URDF, meshes
├── my_robot_bringup/        ← launch files, top-level config
├── my_robot_navigation/     ← Nav2 config, costmaps
└── my_robot_arm/            ← MoveIt 2 config
\`\`\`

This is exactly what you'll see when you clone open-source robot repos. The Gazebo, Nav2, and MoveIt 2 lessons in the next module all assume this structure.

<YouTube id="lu9SBRbq01s" />

${PRACTICE['ros2-workspaces-and-colcon']}`,
}

const NEW_LESSON_NAV2 = {
  slug: 'nav2-navigation-basics',
  title: 'Autonomous Navigation with the Nav2 Stack',
  description: 'Understand how Nav2 gives a robot the ability to navigate autonomously through an environment using costmaps, planners, and behaviour trees.',
  difficulty: 'intermediate',
  estimated_minutes: 22,
  _module_slug: 'simulation-planning',
  sort_order: 1,
  content_mdx: `<Callout type="tip">
**Setup:** Ubuntu 22.04 LTS, ROS 2 Humble. Install Nav2 and the Turtlebot3 simulation: \`sudo apt install ros-humble-navigation2 ros-humble-nav2-bringup ros-humble-turtlebot3-gazebo\`. Set your robot model: \`echo "export TURTLEBOT3_MODEL=burger" >> ~/.bashrc\`
</Callout>

## Why autonomous navigation is harder than it looks

A robot that can drive forward is easy. A robot that can find its own way from the kitchen to the living room — avoiding a chair someone moved this morning — is a different problem entirely. That gap is what Nav2 solves. It is the standard autonomous navigation framework for ROS 2, used in everything from warehouse robots to outdoor delivery platforms.

## What Nav2 actually does

Nav2 is not a single node — it is a coordinated system of components:

| Component | Job |
|---|---|
| **Map server** | Loads a pre-built 2D occupancy grid |
| **AMCL** | Localises the robot on that map using LIDAR |
| **Costmap 2D** | Inflates obstacles so the robot keeps its distance |
| **Global planner** | Finds an optimal path from A to B |
| **Local planner** | Follows that path while dodging dynamic obstacles |
| **Behaviour tree** | Orchestrates all of the above, handles failures |

## The costmap: how Nav2 sees the world

Each cell in the costmap has a cost value — 0 for free space, 254 for lethal obstacle, and 1–253 for the inflation zone around obstacles. The inflation radius is the most important parameter to tune:

\`\`\`yaml
# costmap_common_params.yaml
robot_radius: 0.22
inflation_layer:
  inflation_radius: 0.55
  cost_scaling_factor: 3.0
\`\`\`

Too small and your robot clips furniture. Too large and it cannot navigate through doorways.

## Behaviour trees in Nav2

Nav2 uses behaviour trees rather than a state machine. A behaviour tree is a directed graph of conditions and actions:

\`\`\`
NavigateToPose
└── PipelineSequence
    ├── RateController
    │   └── ComputePathToPose
    ├── FollowPath
    └── GoalReached?
\`\`\`

If \`FollowPath\` fails, the tree re-ticks \`ComputePathToPose\` automatically. Custom trees are XML files loaded at runtime — no C++ required.

## Launch Nav2 with Turtlebot3

\`\`\`bash
# Terminal 1 — simulation
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py

# Terminal 2 — Nav2 stack
ros2 launch nav2_bringup navigation_launch.py use_sim_time:=True

# Terminal 3 — RViz
ros2 launch nav2_bringup rviz_launch.py
\`\`\`

In RViz, click **2D Pose Estimate** to initialise AMCL, then click **Nav2 Goal** to send a destination. Watch the global path appear and the local planner steer the robot.

<Callout type="warning">
Always set \`use_sim_time:=True\` when running Nav2 in Gazebo. If simulation time and system time are out of sync, AMCL localisation will silently fail and your robot will drift off its map.
</Callout>

## Key parameters

\`\`\`yaml
bt_navigator:
  default_nav_to_pose_bt_xml: path/to/your/tree.xml

planner_server:
  GridBased:
    plugin: nav2_navfn_planner/NavfnPlanner
    tolerance: 0.5

controller_server:
  FollowPath:
    plugin: dwb_core::DWBLocalPlanner
    max_vel_x: 0.26
\`\`\`

<YouTube id="idQb2pB-h2Q" />

${PRACTICE['motion-planning-moveit2'].replace('motion-planning-moveit2', 'nav2-navigation-basics')}`,
}

const NEW_LESSON_MOVEIT = {
  slug: 'moveit2-arm-motion-planning',
  title: 'Arm Motion Planning with MoveIt 2',
  description: 'Use MoveIt 2 to plan and execute collision-free motion for a robot arm, from configuring the move group to sending goals from code.',
  difficulty: 'intermediate',
  estimated_minutes: 25,
  _module_slug: 'simulation-planning',
  sort_order: 2,
  content_mdx: `<Callout type="tip">
**Setup:** Ubuntu 22.04 LTS, ROS 2 Humble. Install MoveIt 2 and the Panda simulation: \`sudo apt install ros-humble-moveit ros-humble-moveit-resources-panda-moveit-config\`. Source your workspace after installation.
</Callout>

## The problem with moving a robot arm

Driving a mobile robot to a coordinate is straightforward. Moving a 6-DOF arm so the end-effector reaches a target pose without hitting anything — while coordinating six joints simultaneously — is a different problem entirely. MoveIt 2 solves it: you describe where you want the hand to go and it handles the rest.

## How MoveIt 2 is structured

MoveIt 2 centres on the **move group node**, which connects your URDF, the planning scene, and the hardware interface:

\`\`\`
Your code
    ↓ MoveGroupInterface
move_group node
    ├── OMPL planner (trajectory computation)
    ├── Planning scene monitor (collision objects)
    └── Controller manager → ros2_control → hardware
\`\`\`

## Launching MoveIt 2 with the Panda arm

\`\`\`bash
ros2 launch panda_moveit_config demo.launch.py
\`\`\`

RViz opens with the MotionPlanning panel. Drag the interactive marker to a target pose, click **Plan**, then **Execute**. The arm animates a collision-free trajectory.

## Planning from code

\`\`\`python
import rclpy
from moveit.planning import MoveItPy

rclpy.init()
robot = MoveItPy(node_name="moveit_py_client")
arm = robot.get_planning_component("panda_arm")

arm.set_start_state_to_current_state()
arm.set_goal_state(configuration_name="ready")
plan = arm.plan()

if plan:
    robot.execute(plan, controllers=[])

rclpy.shutdown()
\`\`\`

Named poses like \`"ready"\` are defined in your robot's SRDF file.

## Adding collision objects

\`\`\`python
from moveit_msgs.msg import CollisionObject
from shape_msgs.msg import SolidPrimitive
from geometry_msgs.msg import Pose

box = CollisionObject()
box.id = "table"
box.header.frame_id = "world"

shape = SolidPrimitive()
shape.type = SolidPrimitive.BOX
shape.dimensions = [0.8, 1.2, 0.05]

pose = Pose()
pose.position.z = 0.4

box.primitives = [shape]
box.primitive_poses = [pose]
box.operation = CollisionObject.ADD
\`\`\`

Once added, the planner treats the box as an obstacle and routes around it automatically.

## The SRDF

The SRDF defines what URDF cannot — planning groups, named states, passive joints, and collision exclusions between adjacent links:

\`\`\`xml
<group name="panda_arm">
  <chain base_link="panda_link0" tip_link="panda_link8"/>
</group>
<named_state name="ready" group="panda_arm">
  <joint name="panda_joint1" value="0"/>
  <joint name="panda_joint2" value="-0.785"/>
</named_state>
\`\`\`

<Callout type="warning">
The MoveIt 2 Python API (\`moveit.planning\`) is newer and still evolving. Examples online using \`moveit_commander\` are ROS 1 or early ROS 2 — they will not work with Humble. Always check the [MoveIt 2 GitHub](https://github.com/moveit/moveit2) for current examples.
</Callout>

<YouTube id="JB0noQFhAe4" />

${PRACTICE['motion-planning-moveit2']}`,
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('Fetching all lessons and modules from Supabase...')

  const { data: modules, error: modErr } = await supabase
    .from('modules').select('id, slug')
  if (modErr) { console.error('Failed to fetch modules:', modErr); process.exit(1) }

  const moduleBySlug = Object.fromEntries(modules.map(m => [m.slug, m.id]))
  console.log('Modules found:', Object.keys(moduleBySlug).join(', '))

  const { data: lessons, error: lesErr } = await supabase
    .from('lessons').select('id, slug, content_mdx, description')
  if (lesErr) { console.error('Failed to fetch lessons:', lesErr); process.exit(1) }

  const lessonBySlug = Object.fromEntries(lessons.map(l => [l.slug, l]))
  console.log(`Lessons found: ${lessons.length}`)

  // ── Item 3: update sensor-fusion-basics description ────────────────────────
  console.log('\n[Item 3] Updating sensor-fusion-basics description...')
  const { error: sfErr } = await supabase
    .from('lessons')
    .update({
      description: 'Combine IMU, encoder, and camera data for reliable robot state estimation using ROS 2 sensor_msgs types and the robot_localization package.',
    })
    .eq('slug', 'sensor-fusion-basics')
  if (sfErr) console.error('  ✗', sfErr.message)
  else console.log('  ✓ sensor-fusion-basics description updated')

  // ── Items 4, 5, 6: update all existing lessons ─────────────────────────────
  console.log('\n[Items 4/5/6] Updating existing lesson content...')

  for (const lesson of lessons) {
    const slug = lesson.slug
    let mdx = lesson.content_mdx ?? ''

    // Item 6: prepend Setup callout to ROS 2 lessons (only if not already present)
    if (SETUP_CALLOUT_SLUGS.has(slug) && !mdx.includes('**Setup:**')) {
      mdx = SETUP_CALLOUT + mdx
    }

    // Item 4: rewrite Overview opening paragraph
    if (OVERVIEWS[slug]) {
      // Replace the paragraph(s) between ## Overview and the next ## heading
      mdx = mdx.replace(
        /(##\s+Overview\s*\n+)([\s\S]*?)(\n##\s)/,
        (_, heading, _body, nextHeading) =>
          `${heading}${OVERVIEWS[slug]}\n${nextHeading}`
      )
      // If no ## Overview exists at all, prepend one after any Callout blocks
      if (!mdx.includes('## Overview')) {
        const calloutEnd = mdx.lastIndexOf('</Callout>')
        const insertAt = calloutEnd !== -1 ? calloutEnd + 10 : 0
        const before = mdx.slice(0, insertAt)
        const after = mdx.slice(insertAt)
        mdx = `${before}\n\n## Overview\n\n${OVERVIEWS[slug]}\n${after}`
      }
    }

    // Item 5: append Practice section (only if not already present)
    if (PRACTICE[slug] && !mdx.includes('## Practice')) {
      mdx = mdx.trimEnd() + '\n' + PRACTICE[slug]
    }

    const { error } = await supabase
      .from('lessons')
      .update({ content_mdx: mdx })
      .eq('slug', slug)

    if (error) console.error(`  ✗ ${slug}:`, error.message)
    else console.log(`  ✓ ${slug}`)
  }

  // ── Items 1 & 2: insert new lessons ───────────────────────────────────────
  console.log('\n[Items 1 & 2] Inserting new lessons...')

  for (const newLesson of [NEW_LESSON_BRIDGE, NEW_LESSON_NAV2, NEW_LESSON_MOVEIT]) {
    const moduleId = moduleBySlug[newLesson._module_slug]
    if (!moduleId) {
      console.error(`  ✗ Module not found for slug: ${newLesson._module_slug}`)
      continue
    }

    // Skip if already exists
    if (lessonBySlug[newLesson.slug]) {
      console.log(`  ~ ${newLesson.slug} already exists, updating...`)
      const { _module_slug, ...fields } = newLesson
      const { error } = await supabase
        .from('lessons')
        .update({ ...fields, module_id: moduleId })
        .eq('slug', newLesson.slug)
      if (error) console.error(`  ✗ ${newLesson.slug}:`, error.message)
      else console.log(`  ✓ ${newLesson.slug} updated`)
      continue
    }

    const { _module_slug, ...fields } = newLesson
    const { error } = await supabase
      .from('lessons')
      .insert({ ...fields, module_id: moduleId })
    if (error) console.error(`  ✗ ${newLesson.slug}:`, error.message)
    else console.log(`  ✓ ${newLesson.slug} inserted`)
  }

  console.log('\nDone.')
}

run().catch(console.error)
