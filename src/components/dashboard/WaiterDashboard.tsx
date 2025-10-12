// import React from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
// import { Link } from 'react-router-dom';

// export const WaiterDashboard: React.FC = () => {
//   // Mock data
//   const myStats = {
//     assignedTables: 8,
//     activeOrders: 5,
//     completedOrders: 12,
//     averageServiceTime: '15:30'
//   };

//   const myTables = [
//     { number: 2, status: 'occupied', customers: 4, orderStatus: 'served', time: '45 min' },
//     { number: 5, status: 'occupied', customers: 2, orderStatus: 'cooking', time: '12 min' },
//     { number: 7, status: 'occupied', customers: 6, orderStatus: 'ready', time: '25 min' },
//     { number: 12, status: 'available', customers: 0, orderStatus: '', time: '' },
//     { number: 15, status: 'needs-cleaning', customers: 0, orderStatus: '', time: '' },
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'ready': return 'text-success bg-success/10';
//       case 'cooking': return 'text-warning bg-warning/10';
//       case 'served': return 'text-primary bg-primary/10';
//       default: return 'text-muted-foreground bg-muted/10';
//     }
//   };

//   const getTableStatusColor = (status: string) => {
//     switch (status) {
//       case 'occupied': return 'border-l-warning';
//       case 'available': return 'border-l-success';
//       case 'needs-cleaning': return 'border-l-destructive';
//       default: return 'border-l-muted';
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-foreground">Waiter Dashboard</h1>
//         <Button asChild size="lg" className="bg-gradient-primary">
//           <Link to="/tables">
//             <Users className="mr-2 h-5 w-5" />
//             Manage Tables
//           </Link>
//         </Button>
//       </div>

//       {/* Today's Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <Card className="bg-gradient-card border-none shadow-card">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Assigned Tables</CardTitle>
//             <Users className="h-4 w-4 text-primary" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-primary">{myStats.assignedTables}</div>
//             <p className="text-xs text-muted-foreground">Your responsibility</p>
//           </CardContent>
//         </Card>

//         <Card className="bg-gradient-card border-none shadow-card">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
//             <Clock className="h-4 w-4 text-warning" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-warning">{myStats.activeOrders}</div>
//             <p className="text-xs text-muted-foreground">In progress</p>
//           </CardContent>
//         </Card>

//         <Card className="bg-gradient-card border-none shadow-card">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
//             <CheckCircle className="h-4 w-4 text-success" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-success">{myStats.completedOrders}</div>
//             <p className="text-xs text-muted-foreground">Orders served</p>
//           </CardContent>
//         </Card>

//         <Card className="bg-gradient-card border-none shadow-card">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Avg. Service Time</CardTitle>
//             <Clock className="h-4 w-4 text-secondary" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-secondary">{myStats.averageServiceTime}</div>
//             <p className="text-xs text-muted-foreground">Order to serve</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* My Tables */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Users className="h-5 w-5" />
//             My Tables
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {myTables.map((table) => (
//               <div key={table.number} className={`p-4 rounded-lg border-l-4 bg-card hover:bg-accent/50 transition-fast ${getTableStatusColor(table.status)}`}>
//                 <div className="flex items-center justify-between mb-2">
//                   <h3 className="font-semibold">Table {table.number}</h3>
//                   <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
//                     table.status === 'occupied' ? 'bg-warning/10 text-warning' :
//                     table.status === 'available' ? 'bg-success/10 text-success' :
//                     'bg-destructive/10 text-destructive'
//                   }`}>
//                     {table.status}
//                   </span>
//                 </div>

//                 {table.customers > 0 && (
//                   <div className="space-y-1 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Customers:</span>
//                       <span>{table.customers}</span>
//                     </div>
//                     {table.orderStatus && (
//                       <div className="flex justify-between">
//                         <span className="text-muted-foreground">Order:</span>
//                         <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(table.orderStatus)}`}>
//                           {table.orderStatus}
//                         </span>
//                       </div>
//                     )}
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Time:</span>
//                       <span>{table.time}</span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Quick Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Button asChild variant="outline" className="h-16 flex-col">
//           <Link to="/tables">
//             <Users className="h-6 w-6 mb-2" />
//             <span>Seat Customers</span>
//           </Link>
//         </Button>

//         <Button asChild variant="outline" className="h-16 flex-col">
//           <Link to="/pos">
//             <Clock className="h-6 w-6 mb-2" />
//             <span>Take Order</span>
//           </Link>
//         </Button>

//         <Button asChild variant="outline" className="h-16 flex-col">
//           <Link to="/kitchen">
//             <CheckCircle className="h-6 w-6 mb-2" />
//             <span>Check Kitchen</span>
//           </Link>
//         </Button>

//         <Button asChild variant="outline" className="h-16 flex-col">
//           <Link to="/tables">
//             <AlertCircle className="h-6 w-6 mb-2" />
//             <span>Mark Served</span>
//           </Link>
//         </Button>
//       </div>
//     </div>
//   );
// };
